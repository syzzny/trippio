import L from 'leaflet';
import type { Destination } from '@/types/trip';

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const destinationIcon = (dest: Destination, selected: boolean) =>
  L.divIcon({
    className: 'trippio-icon',
    iconSize: [0, 0],
    html: `<div class="dest-pin ${selected ? 'is-selected' : ''}">
      <span class="dest-pin__thumb" style="background-image:url('${dest.image}'), linear-gradient(135deg, var(--sky-50), var(--primary-50))"></span>
      <span class="dest-pin__label">${escape(dest.name)}</span>
    </div>`,
  });

export const originIcon = (name: string) =>
  L.divIcon({
    className: 'trippio-icon',
    iconSize: [0, 0],
    html: `<div class="origin-pin"><span class="origin-pin__dot"></span><span class="origin-pin__label">출발<b>${escape(name)}</b></span></div>`,
  });

/** 두 지점 사이를 곡선으로 잇는 좌표 (비행 경로 표현) */
export const arcPoints = (from: [number, number], to: [number, number], segments = 32): [number, number][] => {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dist = Math.hypot(lat2 - lat1, lng2 - lng1);
  // 진행 방향의 수직으로 띄워 곡선을 만듦
  const ctrlLat = midLat + (lng2 - lng1) * 0.18 + dist * 0.12;
  const ctrlLng = midLng - (lat2 - lat1) * 0.18;
  return Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments;
    const a = (1 - t) ** 2;
    const b = 2 * (1 - t) * t;
    const c = t ** 2;
    return [a * lat1 + b * ctrlLat + c * lat2, a * lng1 + b * ctrlLng + c * lng2];
  });
};
