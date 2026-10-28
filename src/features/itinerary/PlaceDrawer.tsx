import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, CreditCard, Hourglass, MapPin, Navigation, Repeat, Star, X } from 'lucide-react';
import { Button, SmartImage } from '@/components/ui';
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/data/places';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { formatDuration, toMinutes } from '@/lib/time';
import { AiReason } from './AiReason';
import { usePlacePhoto } from '@/api/placePhoto';
import type { Place, Stop } from '@/types/itinerary';
import styles from './PlaceDrawer.module.scss';

interface Props {
  order: number;
  stop: Stop;
  place: Place;
  onClose: () => void;
  onReplace: () => void;
}

/** 07 · 장소 상세. 지도 위 오른쪽 패널 (ESC로 닫기) */
export function PlaceDrawer({ order, stop, place, onClose, onReplace }: Props) {
  const ref = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  // 명소는 위키백과 실제 사진을 찾아 쓰고, 없으면 3D 아이콘을 그대로 둬요
  const { data: photo } = usePlacePhoto(place);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = photo && photo.url !== failedUrl;
  const closeRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(ref, true, onClose, { initialFocus: closeRef, trap: false });

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const rows = [
    { icon: Clock, label: '영업시간', value: place.hours },
    { icon: MapPin, label: '위치', value: place.access },
    { icon: CreditCard, label: '예상 비용', value: place.cost ? `1인 약 ${(place.cost / 10000).toFixed(1).replace('.0', '')}만원` : '무료' },
    { icon: Hourglass, label: '머무는 시간', value: formatDuration(toMinutes(stop.end) - toMinutes(stop.start)) },
  ];

  const drawer = (
    <aside ref={ref} className={styles.drawer} role="dialog" aria-modal="false" aria-labelledby="place-title" tabIndex={-1}>
      <div className={styles.top}>
        <p className={styles.overline}>
          STOP {String(order).padStart(2, '0')} · {stop.start} – {stop.end}
        </p>
        <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="장소 상세 닫기">
          <X size={16} />
        </button>
      </div>

      <div className={styles.body}>
        <figure className={styles.figure}>
          {showPhoto ? (
            <img
              src={photo.url}
              alt={`${place.name} 사진`}
              className={styles.photo}
              decoding="async"
              onError={() => setFailedUrl(photo.url)}
            />
          ) : (
            <SmartImage src={place.image} alt={`${place.name} 이미지`} className={styles.photo} />
          )}
          {showPhoto && (
            <figcaption className={styles.credit}>
              사진{' '}
              <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
                {photo.artist}
                <span className="sr-only"> (위키미디어 공용, 새 창)</span>
              </a>{' '}
              · {photo.license}
            </figcaption>
          )}
        </figure>

        <div className={styles.head}>
          <h2 id="place-title" className={styles.name}>{place.name}</h2>
          <p className={styles.meta}>
            <span className={styles.dot} style={{ background: CATEGORY_COLOR[place.category] }} aria-hidden />
            {CATEGORY_LABEL[place.category]} · {place.area}
            <span aria-hidden>·</span>
            <Star size={13} fill="var(--sun-500)" color="var(--sun-500)" aria-hidden /> 인기도 {place.popularity}
          </p>
          <p className={styles.desc}>{place.description}</p>
          <ul className={styles.tags}>
            {place.tags.map((t) => (
              <li key={t}>#{t}</li>
            ))}
          </ul>
        </div>

        <dl className={styles.info}>
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className={styles.row}>
              <dt>
                <Icon size={15} aria-hidden /> {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <AiReason title="피오가 이 장소를 고른 이유" reasons={stop.reasons} />

        {place.menu && (
          <section aria-labelledby="menu-title">
            <h3 id="menu-title" className={styles.subTitle}>추천 메뉴</h3>
            <ul className={styles.menu}>
              {place.menu.map((m) => (
                <li key={m.name}>
                  <SmartImage src={m.image} alt="" blend className={styles.menuImg} />
                  <span className={styles.menuName}>{m.name}</span>
                  <span className={styles.menuPrice}>{m.price}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" fullWidth leftIcon={<Repeat size={16} />} onClick={onReplace}>
          다른 장소로 바꾸기
        </Button>
        <a className={styles.link} href={directions} target="_blank" rel="noreferrer">
          <Navigation size={16} aria-hidden /> 길찾기
          <span className="sr-only">(구글 지도, 새 창)</span>
        </a>
      </div>
    </aside>
  );

  // 모바일은 화면 아래에서 올라오는 시트라, 지도 영역 밖(body)에 그려서 탭 바·일정 시트 위에 보이게 해요
  return isMobile ? createPortal(<><div className={styles.scrim} onClick={onClose} aria-hidden />{drawer}</>, document.body) : drawer;
}
