export const weatherIcon = (rainChance: number) =>
  rainChance >= 40 ? '/images/3d-weather-rain.jpg' : rainChance >= 25 ? '/images/3d-weather-cloud.jpg' : '/images/3d-weather-sun.jpg';

export const weatherLabel = (rainChance: number) => (rainChance >= 40 ? '비' : rainChance >= 25 ? '흐림' : '맑음');
