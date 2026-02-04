/**
 * Weather API integration using Open-Meteo (free, no API key required)
 */

import type { Weather } from '../themes/weather';
import type { GeolocationCoords } from './geolocation';

export interface WeatherData {
  temperature: number;
  weatherType: Weather;
  timestamp: number;
}

export interface WeatherApiResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
  };
}

/**
 * Map Open-Meteo weather codes to our weather types
 * Based on WMO Weather interpretation codes:
 * https://open-meteo.com/en/docs
 */
export function mapWeatherCodeToType(code: number): Weather {
  // Clear (0-1)
  if (code <= 1) return 'clear';
  
  // Cloudy (2-3)
  if (code <= 3) return 'cloudy';
  
  // Snow (71-77, 85-86)
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return 'snowy';
  }
  
  // Everything else is rainy (fog, drizzle, rain, thunderstorm, etc.)
  return 'rainy';
}

/**
 * Fetch current weather data from Open-Meteo API
 * @param coords User's location coordinates
 * @returns Weather data or null on error
 */
export async function fetchWeather(
  coords: GeolocationCoords
): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Weather API error:', response.status);
      return null;
    }
    
    const data: WeatherApiResponse = await response.json();
    
    return {
      temperature: Math.round(data.current.temperature_2m),
      weatherType: mapWeatherCodeToType(data.current.weather_code),
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}

/**
 * Check if cached weather data is still fresh (less than 10 minutes old)
 */
export function isWeatherDataFresh(timestamp: number, maxAgeMinutes: number = 10): boolean {
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  return Date.now() - timestamp < maxAgeMs;
}
