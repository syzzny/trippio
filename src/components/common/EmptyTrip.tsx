import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button, SmartImage } from '@/components/ui';
import styles from './EmptyTrip.module.scss';

/** 아직 만든 일정이 없을 때 — 메뉴 선택 표시가 유지되도록 다른 화면으로 보내지 않고 여기서 안내해요 */
export function EmptyTrip() {
  const navigate = useNavigate();
  return (
    <section className={styles.empty} aria-labelledby="empty-trip-title">
      <SmartImage src="/images/3d-empty-suitcase.jpg" alt="" blend className={styles.img} />
      <h1 id="empty-trip-title" className={styles.title}>아직 만든 일정이 없어요</h1>
      <p className={styles.desc}>여행지와 조건을 고르면 여행 친구 피오가 날씨와 동선까지 고려해 일정을 만들어 드려요</p>
      <Button variant="primary" rightIcon={<ArrowRight size={16} />} onClick={() => navigate('/')}>
        여행지 고르러 가기
      </Button>
    </section>
  );
}
