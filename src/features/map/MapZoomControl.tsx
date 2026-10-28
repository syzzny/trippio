import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Minus, Plus } from 'lucide-react';
import clsx from 'clsx';
import styles from './MapZoomControl.module.scss';

interface Props {
  position?: 'topright' | 'bottomright';
}

/** Leaflet 기본 컨트롤(+ − 문자) 대신 디자인 시스템 아이콘을 쓰는 확대·축소 버튼 */
export function MapZoomControl({ position = 'topright' }: Props) {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const update = () => setZoom(map.getZoom());
    map.on('zoomend', update);
    return () => {
      map.off('zoomend', update);
    };
  }, [map]);

  // 버튼을 누를 때 지도가 함께 드래그·더블클릭 확대되지 않도록
  useEffect(() => {
    if (!ref.current) return;
    L.DomEvent.disableClickPropagation(ref.current);
    L.DomEvent.disableScrollPropagation(ref.current);
  }, []);

  return (
    <div ref={ref} className={clsx(styles.control, styles[position])} role="group" aria-label="지도 확대·축소">
      <button
        type="button"
        className={styles.button}
        onClick={() => map.zoomIn()}
        disabled={zoom >= map.getMaxZoom()}
        aria-label="지도 확대"
      >
        <Plus size={18} strokeWidth={2} aria-hidden />
      </button>
      <span className={styles.divider} aria-hidden />
      <button
        type="button"
        className={styles.button}
        onClick={() => map.zoomOut()}
        disabled={zoom <= map.getMinZoom()}
        aria-label="지도 축소"
      >
        <Minus size={18} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
