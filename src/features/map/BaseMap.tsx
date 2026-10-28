import { useEffect, type ReactNode } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { FitBoundsOptions, LatLngBoundsExpression, LatLngExpression, Point } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapZoomControl } from './MapZoomControl';
import './map.scss';

interface BaseMapProps {
  center: LatLngExpression;
  zoom: number;
  children?: ReactNode;
  /** 이 좌표로 부드럽게 이동 */
  flyTo?: { center: LatLngExpression; zoom?: number } | null;
  fitBounds?: LatLngBoundsExpression | null;
  /** 지도 위 카드가 가리는 영역만큼 여백. 지도 크기에 따라 달라지면 함수로 넘겨요 */
  fitOptions?: FitBoundsOptions | ((size: Point) => FitBoundsOptions);
  label: string;
  zoomPosition?: 'topright' | 'bottomright';
}

function Controller({ flyTo, fitBounds, fitOptions }: Pick<BaseMapProps, 'flyTo' | 'fitBounds' | 'fitOptions'>) {
  const map = useMap();
  // 패널 레이아웃(flex) 때문에 컨테이너 크기가 늦게 확정되면 선·마커 좌표가 어긋나요.
  // 크기가 바뀔 때마다 Leaflet에 다시 계산하도록 알려줘요.
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  useEffect(() => {
    if (flyTo) map.flyTo(flyTo.center, flyTo.zoom ?? map.getZoom(), { duration: 0.8 });
  }, [map, flyTo]);
  // 이동 애니메이션 도중 추가된 선(Polyline)이 중간 상태 좌표로 고정되는 문제가 있어서,
  // 이동이 끝나면 모든 레이어 좌표를 다시 계산해요.
  useEffect(() => {
    const reproject = () => map.fire('viewreset');
    map.on('moveend', reproject);
    return () => {
      map.off('moveend', reproject);
    };
  }, [map]);
  useEffect(() => {
    if (!fitBounds) return;
    const opts = typeof fitOptions === 'function' ? fitOptions(map.getSize()) : fitOptions;
    map.flyToBounds(fitBounds, { padding: [60, 60], duration: 0.6, ...opts });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitBounds]);
  return null;
}

// Esri Light Gray Canvas: API 키 없이 쓸 수 있는 무채색 타일.
// map.scss의 필터로 바다는 하늘색, 육지는 흰색에 가깝게 톤을 맞춰요.
const TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
// 한국은 지도 데이터 반출 제한 때문에 Esri 타일이 줌 13까지만 있고(그 이상은 "Map data not yet available"),
// 그마저도 도로·바다가 거의 없어요. 한국 데이터가 충실한 OpenStreetMap 타일을 무채색 필터로 톤만 맞춰 써요.
const KOREA_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const KOREA_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** 지도 중심이 한국(본토·제주)인지 */
const isKorea = (center: LatLngExpression) => {
  const [lat, lng] = Array.isArray(center) ? center : [center.lat, center.lng];
  return lat > 33 && lat < 38.7 && lng > 124.5 && lng < 131.9;
};
const TILE_ATTRIBUTION = 'Tiles &copy; <a href="https://www.esri.com">Esri</a> &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors';
export function BaseMap({ center, zoom, children, flyTo, fitBounds, fitOptions, label, zoomPosition = 'topright' }: BaseMapProps) {
  const korea = isKorea(center);
  return (
    <div className={korea ? 'trippio-map is-street' : 'trippio-map'} role="region" aria-label={label}>
      <MapContainer center={center} zoom={zoom} zoomSnap={0.25} zoomDelta={0.5} minZoom={2} zoomControl={false} scrollWheelZoom worldCopyJump style={{ height: '100%', width: '100%' }}>
        <TileLayer
          key={korea ? 'kr' : 'world'}
          attribution={korea ? KOREA_ATTRIBUTION : TILE_ATTRIBUTION}
          url={korea ? KOREA_TILE_URL : TILE_URL}
          maxZoom={16}
        />
        <MapZoomControl position={zoomPosition} />
        <Controller flyTo={flyTo} fitBounds={fitBounds} fitOptions={fitOptions} />
        {children}
      </MapContainer>
    </div>
  );
}
