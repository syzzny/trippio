import { useQuery } from '@tanstack/react-query';
import { getJSON } from './http';
import { addDays, diffDays, todayISO } from '@/lib/date';
import type { DailyForecast, Destination } from '@/types/trip';

interface OpenMeteoDaily {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
  };
}

const FORECAST_LIMIT_DAYS = 15; // Open-Meteo 예보 제공 범위(16일) 안쪽만 요청

const climateFallback = (dest: Destination, start: string, end: string): DailyForecast[] => {
  const len = Math.max(1, diffDays(start, end) + 1);
  return Array.from({ length: len }, (_, i) => ({
    date: addDays(start, i),
    // 평년값에 날짜별로 약간의 변화를 줘서 단조롭지 않게
    high: dest.climate.high + [0, 1, -2, -1, 1, 0, -1][i % 7],
    low: dest.climate.low + [0, 1, -1, -1, 0, 1, 0][i % 7],
    rainChance: Math.min(90, dest.climate.rainChance + [-10, -10, 20, 0, -10, 10, 0][i % 7]),
    source: 'climate',
  }));
};

export async function fetchForecast(dest: Destination, start: string, end: string, signal?: AbortSignal) {
  const daysAhead = diffDays(todayISO(), end);
  if (daysAhead > FORECAST_LIMIT_DAYS || diffDays(todayISO(), start) < 0) {
    return climateFallback(dest, start, end);
  }
  const params = new URLSearchParams({
    latitude: String(dest.lat),
    longitude: String(dest.lng),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    start_date: start,
    end_date: end,
  });
  const data = await getJSON<OpenMeteoDaily>(`https://api.open-meteo.com/v1/forecast?${params}`, signal);
  return data.daily.time.map<DailyForecast>((date, i) => ({
    date,
    high: Math.round(data.daily.temperature_2m_max[i]),
    low: Math.round(data.daily.temperature_2m_min[i]),
    rainChance: data.daily.precipitation_probability_max[i] ?? 0,
    source: 'forecast',
  }));
}

export const useForecast = (dest: Destination | null, start: string, end: string) =>
  useQuery({
    queryKey: ['forecast', dest?.id, start, end],
    queryFn: ({ signal }) => fetchForecast(dest!, start, end, signal),
    enabled: !!dest,
    staleTime: 1000 * 60 * 30,
    // 네트워크 오류 시에도 화면이 비지 않도록 평년값으로 대체
    placeholderData: dest ? climateFallback(dest, start, end) : undefined,
  });
