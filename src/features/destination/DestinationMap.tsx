import { useMemo } from 'react';
import { Marker, Polyline } from 'react-leaflet';
import { BaseMap } from '@/features/map/BaseMap';
import { arcPoints, destinationIcon, originIcon } from '@/features/map/markers';
import { ORIGIN } from '@/data/destinations';
import type { Destination } from '@/types/trip';

interface Props {
  destinations: Destination[];
  selected: Destination | null;
  onSelect: (id: string) => void;
}

export function DestinationMap({ destinations, selected, onSelect }: Props) {
  const arc = useMemo(
    () => (selected ? arcPoints([ORIGIN.lat, ORIGIN.lng], [selected.lat, selected.lng]) : null),
    [selected],
  );
  // 보이는 여행지 + 출발지를 모두 담되, 하단 미리보기 카드 영역은 비워둬요
  const bounds = useMemo(() => {
    const pts = destinations.map((d) => [d.lat, d.lng] as [number, number]);
    if (pts.length === 0) return null;
    return [...pts, [ORIGIN.lat, ORIGIN.lng] as [number, number]];
  }, [destinations]);

  return (
    <BaseMap
      center={[25, 125]}
      zoom={3}
      fitBounds={bounds}
      fitOptions={(size) =>
        // 넓은 지도: 상단 필터·하단 미리보기 카드 자리를 비워요 / 좁은 지도(모바일): 카드가 없으니 여백만
        size.y >= 600
          ? { paddingTopLeft: [60, 90], paddingBottomRight: [60, 230], maxZoom: 7 }
          : { paddingTopLeft: [24, 70], paddingBottomRight: [24, 24], maxZoom: 7 }
      }
      label="여행지 지도"
    >
      <Marker position={[ORIGIN.lat, ORIGIN.lng]} icon={originIcon(ORIGIN.name)} interactive={false} />
      {arc && <Polyline positions={arc} pathOptions={{ color: '#222', weight: 2, dashArray: '3 7', lineCap: 'round' }} />}
      {destinations.map((d) => (
        <Marker
          key={d.id}
          position={[d.lat, d.lng]}
          icon={destinationIcon(d, d.id === selected?.id)}
          zIndexOffset={d.id === selected?.id ? 1000 : 0}
          title={d.name}
          alt={`${d.name} 선택`}
          keyboard
          eventHandlers={{ click: () => onSelect(d.id) }}
        />
      ))}
    </BaseMap>
  );
}
