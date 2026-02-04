import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mapWeatherCodeToType,
  fetchWeather,
  isWeatherDataFresh,
} from '../src/utils/weatherApi';

describe('Weather API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapWeatherCodeToType', () => {
    it('maps codes 0-1 to clear', () => {
      expect(mapWeatherCodeToType(0)).toBe('clear');
      expect(mapWeatherCodeToType(1)).toBe('clear');
    });

    it('maps codes 2-3 to cloudy', () => {
      expect(mapWeatherCodeToType(2)).toBe('cloudy');
      expect(mapWeatherCodeToType(3)).toBe('cloudy');
    });

    it('maps snow codes to snowy', () => {
      expect(mapWeatherCodeToType(71)).toBe('snowy');
      expect(mapWeatherCodeToType(75)).toBe('snowy');
      expect(mapWeatherCodeToType(77)).toBe('snowy');
      expect(mapWeatherCodeToType(85)).toBe('snowy');
      expect(mapWeatherCodeToType(86)).toBe('snowy');
    });

    it('maps other codes to rainy', () => {
      expect(mapWeatherCodeToType(45)).toBe('rainy'); // Fog
      expect(mapWeatherCodeToType(51)).toBe('rainy'); // Drizzle
      expect(mapWeatherCodeToType(61)).toBe('rainy'); // Rain
      expect(mapWeatherCodeToType(80)).toBe('rainy'); // Rain showers
      expect(mapWeatherCodeToType(95)).toBe('rainy'); // Thunderstorm
    });
  });

  describe('fetchWeather', () => {
    const mockCoords = {
      latitude: 60.1699,
      longitude: 24.9384,
    };

    it('fetches and returns weather data successfully', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 15.5,
          weather_code: 2,
        },
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await fetchWeather(mockCoords);

      expect(result).not.toBeNull();
      expect(result?.temperature).toBe(16); // Rounded
      expect(result?.weatherType).toBe('cloudy');
      expect(result?.timestamp).toBeGreaterThan(0);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`latitude=${mockCoords.latitude}`)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`longitude=${mockCoords.longitude}`)
      );
    });

    it('returns null when API request fails', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      );

      const result = await fetchWeather(mockCoords);

      expect(result).toBeNull();
    });

    it('returns null when fetch throws error', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const result = await fetchWeather(mockCoords);

      expect(result).toBeNull();
    });

    it('constructs correct API URL', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 20,
          weather_code: 0,
        },
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      await fetchWeather(mockCoords);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.open-meteo.com/v1/forecast?latitude=60.1699&longitude=24.9384&current=temperature_2m,weather_code'
      );
    });
  });

  describe('isWeatherDataFresh', () => {
    it('returns true for recent data (less than 10 minutes) with default', () => {
      const recentTimestamp = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      expect(isWeatherDataFresh(recentTimestamp)).toBe(true);
    });

    it('returns false for old data (more than 10 minutes) with default', () => {
      const oldTimestamp = Date.now() - 15 * 60 * 1000; // 15 minutes ago
      expect(isWeatherDataFresh(oldTimestamp)).toBe(false);
    });

    it('returns true for data exactly at 9 minutes', () => {
      const timestamp = Date.now() - 9 * 60 * 1000;
      expect(isWeatherDataFresh(timestamp)).toBe(true);
    });

    it('returns false for data exactly at 11 minutes', () => {
      const timestamp = Date.now() - 11 * 60 * 1000;
      expect(isWeatherDataFresh(timestamp)).toBe(false);
    });

    it('returns true for data at boundary (9:59)', () => {
      const timestamp = Date.now() - (9 * 60 + 59) * 1000;
      expect(isWeatherDataFresh(timestamp)).toBe(true);
    });

    it('returns false for data just past boundary (10:01)', () => {
      const timestamp = Date.now() - (10 * 60 + 1) * 1000;
      expect(isWeatherDataFresh(timestamp)).toBe(false);
    });

    it('supports custom max age in minutes', () => {
      const timestamp = Date.now() - 3 * 60 * 1000; // 3 minutes ago
      expect(isWeatherDataFresh(timestamp, 5)).toBe(true); // Fresh within 5 min
      expect(isWeatherDataFresh(timestamp, 2)).toBe(false); // Stale beyond 2 min
    });

    it('returns true for data just created', () => {
      const timestamp = Date.now() - 1000; // 1 second ago
      expect(isWeatherDataFresh(timestamp)).toBe(true);
    });

    it('returns false for very old data', () => {
      const timestamp = Date.now() - 60 * 60 * 1000; // 1 hour ago
      expect(isWeatherDataFresh(timestamp)).toBe(false);
    });

    it('handles edge case of future timestamp gracefully', () => {
      const futureTimestamp = Date.now() + 5 * 60 * 1000; // 5 min in future
      expect(isWeatherDataFresh(futureTimestamp)).toBe(true); // Should still be "fresh"
    });
  });
});
