import { useNavigate } from 'react-router-dom';
import { Button, SmartImage } from '@/components/ui';
import styles from './ComingSoonPage.module.scss';

/** 2단계에서 구현할 화면의 임시 자리 */
export default function ComingSoonPage({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <section className={styles.root} aria-labelledby="soon-title">
      <SmartImage src="/images/3d-ai-generating.jpg" alt="" blend className={styles.img} />
      <h1 id="soon-title" className={styles.title}>{title}</h1>
      <p className={styles.desc}>다음 단계에서 구현될 화면이에요.</p>
      <Button variant="secondary" onClick={() => navigate(-1)}>이전으로</Button>
    </section>
  );
}
