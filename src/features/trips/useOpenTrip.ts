import { useNavigate } from 'react-router-dom';
import { setLivePlaces } from '@/data/places';
import { useItinerary } from '@/store/ItineraryContext';
import { useTripDraft } from '@/store/TripDraftContext';
import { tripEnd, tripStart, type SavedTrip } from '@/store/trips';

/** 저장한 여행을 다시 열어요: 장소 데이터·조건·일정을 복원한 뒤 화면을 옮겨요 */
export function useOpenTrip() {
  const navigate = useNavigate();
  const { setItinerary } = useItinerary();
  const { dispatch } = useTripDraft();

  return (trip: SavedTrip, to: '/plan' | '/overview' = '/plan') => {
    const it = trip.itinerary;
    if (trip.places.length) setLivePlaces(it.destinationId, trip.places);
    dispatch({
      type: 'load',
      draft: {
        destinationId: it.destinationId,
        startDate: tripStart(it),
        endDate: tripEnd(it),
        adults: it.adults ?? 2,
        children: it.children ?? 0,
        budget: it.budget,
        styles: it.styles,
        request: it.request,
      },
    });
    setItinerary(it);
    navigate(to);
  };
}
