import { Fragment } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { StopCard } from './StopCard';
import { LegRow } from './LegRow';
import { toMinutes } from '@/lib/time';
import type { DayPlan, Place, Stop } from '@/types/itinerary';
import styles from './DayTimeline.module.scss';

interface Props {
  day: DayPlan;
  placeOf: (id: string) => Place | null;
  selectedId: string | null;
  editing: boolean;
  onSelect: (stopId: string) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (stopId: string) => void;
  onAdd: () => void;
}

/**
 * 드래그는 세로로만, 목록 영역 안에서만 움직이게 해요.
 * (가로로 끌면 카드가 패널 밖으로 나가 가로 스크롤이 생기던 문제 방지)
 */
const restrictToListVertical: Modifier = ({ transform, draggingNodeRect, containerNodeRect }) => {
  if (!draggingNodeRect || !containerNodeRect) return { ...transform, x: 0 };
  const minY = containerNodeRect.top - draggingNodeRect.top;
  const maxY = containerNodeRect.bottom - draggingNodeRect.bottom;
  return { ...transform, x: 0, y: Math.min(Math.max(transform.y, minY), maxY) };
};

function SortableStop(props: { stop: Stop; place: Place; order: number } & Pick<Props, 'selectedId' | 'editing' | 'onSelect' | 'onRemove'>) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.stop.id,
    disabled: !props.editing,
  });
  return (
    <StopCard
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      order={props.order}
      stop={props.stop}
      place={props.place}
      active={props.selectedId === props.stop.id}
      editing={props.editing}
      dragging={isDragging}
      onSelect={() => props.onSelect(props.stop.id)}
      onRemove={() => props.onRemove(props.stop.id)}
      handleProps={{ ...attributes, ...listeners, ref: setActivatorNodeRef } as React.HTMLAttributes<HTMLButtonElement>}
    />
  );
}

export function DayTimeline({ day, placeOf, selectedId, editing, onSelect, onMove, onRemove, onAdd }: Props) {
  // 키보드로도 순서를 바꿀 수 있어요: 핸들에 포커스 → Space → 방향키 → Space
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = day.stops.findIndex((s) => s.id === active.id);
    const to = day.stops.findIndex((s) => s.id === over.id);
    if (from >= 0 && to >= 0) onMove(from, to);
  };

  if (day.stops.length === 0) {
    return (
      <div className={styles.empty}>
        <p>이 날은 아직 일정이 없어요</p>
        <button type="button" className={styles.add} onClick={onAdd}>
          <Plus size={16} aria-hidden /> 장소 추가
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToListVertical]}
      accessibility={{
        screenReaderInstructions: { draggable: '스페이스바로 잡고 위아래 방향키로 옮긴 뒤 스페이스바로 놓아요.' },
        announcements: {
          onDragStart: () => '장소를 잡았어요',
          onDragOver: ({ over }) => (over ? '위치를 옮기는 중이에요' : ''),
          onDragEnd: () => '순서를 바꿨어요. 이동 시간을 다시 계산했어요',
          onDragCancel: () => '순서 바꾸기를 취소했어요',
        },
      }}
    >
      <SortableContext items={day.stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ol className={editing ? `${styles.list} ${styles.editing}` : styles.list} aria-label={`${day.title} 일정`}>
          {day.stops.map((stop, i) => {
            const place = placeOf(stop.placeId);
            if (!place) return null;
            const leg = day.legs[i];
            const next = day.stops[i + 1];
            const free = leg && next ? toMinutes(next.start) - toMinutes(stop.end) - leg.minutes : 0;
            return (
              <Fragment key={stop.id}>
                <SortableStop
                  stop={stop}
                  place={place}
                  order={i + 1}
                  selectedId={selectedId}
                  editing={editing}
                  onSelect={onSelect}
                  onRemove={onRemove}
                />
                {leg && !editing && <LegRow leg={leg} freeMinutes={free} />}
              </Fragment>
            );
          })}
        </ol>
      </SortableContext>
      {editing && (
        <button type="button" className={styles.add} onClick={onAdd}>
          <Plus size={16} aria-hidden /> 장소 추가
        </button>
      )}
    </DndContext>
  );
}
