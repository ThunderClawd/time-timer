import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isGeolocationSupported,
  requestLocation,
  getGeolocationErrorMessage,
  type GeolocationResult,
} from '../src/utils/geolocation';

describe('Geolocation', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('isGeolocationSupported', () => {
    it('returns true when geolocation is available', () => {
      // Mock navigator.geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {},
        configurable: true,
      });

      expect(isGeolocationSupported()).toBe(true);
    });

    it('returns false when geolocation is not available', () => {
      // Store original geolocation
      const originalGeolocation = global.navigator.geolocation;
      
      // Remove geolocation from navigator
      // @ts-expect-error - intentionally deleting property for test
      delete global.navigator.geolocation;

      expect(isGeolocationSupported()).toBe(false);
      
      // Restore
      if (originalGeolocation) {
        Object.defineProperty(global.navigator, 'geolocation', {
          value: originalGeolocation,
          configurable: true,
        });
      }
    });
  });

  describe('requestLocation', () => {
    it('returns success with coordinates when permission granted', async () => {
      const mockPosition = {
        coords: {
          latitude: 60.1699,
          longitude: 24.9384,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      const getCurrentPositionMock = vi.fn((success) => {
        success(mockPosition);
      });

      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: getCurrentPositionMock,
        },
        configurable: true,
      });

      const result = await requestLocation();

      expect(result.success).toBe(true);
      expect(result.coords).toEqual({
        latitude: 60.1699,
        longitude: 24.9384,
      });
      expect(result.error).toBeUndefined();
      expect(getCurrentPositionMock).toHaveBeenCalledTimes(1);
    });

    it('returns error when permission denied', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      const getCurrentPositionMock = vi.fn((success, error) => {
        error(mockError);
      });

      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: getCurrentPositionMock,
        },
        configurable: true,
      });

      const result = await requestLocation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('denied');
      expect(result.coords).toBeUndefined();
    });

    it('returns error when position unavailable', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      const getCurrentPositionMock = vi.fn((success, error) => {
        error(mockError);
      });

      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: getCurrentPositionMock,
        },
        configurable: true,
      });

      const result = await requestLocation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('unavailable');
    });

    it('returns error when request times out', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      const getCurrentPositionMock = vi.fn((success, error) => {
        error(mockError);
      });

      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: getCurrentPositionMock,
        },
        configurable: true,
      });

      const result = await requestLocation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('timeout');
    });

    it('returns unsupported error when geolocation not available', async () => {
      // Store original geolocation
      const originalGeolocation = global.navigator.geolocation;
      
      // Remove geolocation from navigator
      // @ts-expect-error - intentionally deleting property for test
      delete global.navigator.geolocation;

      const result = await requestLocation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('unsupported');
      
      // Restore
      if (originalGeolocation) {
        Object.defineProperty(global.navigator, 'geolocation', {
          value: originalGeolocation,
          configurable: true,
        });
      }
    });
  });

  describe('getGeolocationErrorMessage', () => {
    it('returns correct message for denied error', () => {
      expect(getGeolocationErrorMessage('denied')).toContain('permission denied');
    });

    it('returns correct message for unavailable error', () => {
      expect(getGeolocationErrorMessage('unavailable')).toContain('unavailable');
    });

    it('returns correct message for timeout error', () => {
      expect(getGeolocationErrorMessage('timeout')).toContain('timed out');
    });

    it('returns correct message for unsupported error', () => {
      expect(getGeolocationErrorMessage('unsupported')).toContain('not supported');
    });
  });
});
