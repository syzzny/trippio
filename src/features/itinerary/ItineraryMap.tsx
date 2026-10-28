import { useMemo } from 'react';
import { Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { BaseMap } from '@/features/map/BaseMap';
import type { DayPlan, Place } from '@/types/itinerary';

interface Props {
  day: DayPlan;
  placeOf: (id: string) => Place | null;
  selectedId: string | null;
  onSelect: (stopId: string) => void;
  center: [number, number];
  /** 지도 위 카드들이 가리는 영역 */
  overlay: { left: number; bottom: number; right: number };
  /** 선택한 장소 이름표 (상세 패널이 열려 있으면 숨겨요) */
  showLabel?: boolean;
}

const numberIcon = (n: number, active: boolean) =>
  L.divIcon({
    className: 'trippio-icon',
    iconSize: [0, 0],
    html: `<span class="stop-marker${active ? ' is-active' : ''}">${n}</span>`,
  });

export function ItineraryMap({ day, placeOf, selectedId, onSelect, center, overlay, showLabel = true }: Props) {
  const points = useMemo(
    () =>
      day.stops
        .map((s) => ({ stop: s, place: placeOf(s.placeId) }))
        .filter((x): x is { stop: (typeof day.stops)[number]; place: Place } => !!x.place),
    [day, placeOf],
  );

  // 날짜가 바뀌거나 장소가 추가·삭제될 때만 지도 범위를 다시 맞춰요 (선택만 바뀌면 유지)
  const boundsKey = points.map((p) => p.place.id).join(',');
  const bounds = useMemo(
    () => (points.length ? points.map((p) => [p.place.lat, p.place.lng] as [number, number]) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day.date, boundsKey],
  );

  return (
    <BaseMap
      center={center}
      zoom={13}
      fitBounds={bounds}
      fitOptions={(size) =>
        size.y >= 600
          ? { paddingTopLeft: [overlay.left + 40, 90], paddingBottomRight: [overlay.right + 40, overlay.bottom + 40], maxZoom: 15 }
          : { padding: [40, 40], maxZoom: 15 }
      }
      label={`${day.title} 지도`}
    >
      {points.slice(0, -1).map((p, i) => {
        const next = points[i + 1];
        const leg = day.legs[i];
        const positions: [number, number][] = [
          [p.place.lat, p.place.lng],
          [next.place.lat, next.place.lng],
        ];
        return (
          <Polyline
            key={`${p.stop.id}-${next.stop.id}`}
            positions={positions}
            pathOptions={{
              color: '#222',
              weight: leg?.mode === 'walk' ? 2.5 : 3.5,
              dashArray: leg?.mode === 'walk' ? '2 7' : undefined,
              lineCap: 'round',
              opacity: 0.9,
            }}
          />
        );
      })}
      {points.map((p, i) => {
        const active = p.stop.id === selectedId;
        return (
          <Marker
            key={p.stop.id}
            position={[p.place.lat, p.place.lng]}
            icon={numberIcon(i + 1, active)}
            zIndexOffset={active ? 1000 : 0}
            title={`${i + 1}. ${p.place.name}`}
            alt={`${i + 1}번째 장소 ${p.place.name}`}
            keyboard
            eventHandlers={{ click: () => onSelect(p.stop.id) }}
          >
            {active && showLabel && (
              <Tooltip permanent direction="right" offset={[18, 0]} className="stop-tooltip">
                <b>{p.place.name}</b>
                <span>{p.stop.start}</span>
              </Tooltip>
            )}
          </Marker>
        );
      })}
    </BaseMap>
  );
}
