/**
 * Geolocation utilities for fetching user's location
 */

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export type GeolocationError = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export interface GeolocationResult {
  success: boolean;
  coords?: GeolocationCoords;
  error?: GeolocationError;
}

/**
 * Check if geolocation is supported in the browser
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Request user's current location
 * @returns Promise with location result
 */
export async function requestLocation(): Promise<GeolocationResult> {
  if (!isGeolocationSupported()) {
    return {
      success: false,
      error: 'unsupported',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      (error) => {
        let errorType: GeolocationError;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = 'unavailable';
            break;
          case error.TIMEOUT:
            errorType = 'timeout';
            break;
          default:
            errorType = 'unavailable';
        }
        resolve({
          success: false,
          error: errorType,
        });
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
      }
    );
  });
}

/**
 * Get error message for geolocation error
 */
export function getGeolocationErrorMessage(error: GeolocationError): string {
  switch (error) {
    case 'denied':
      return 'Location permission denied. Please enable location access in your browser settings.';
    case 'unavailable':
      return 'Location unavailable. Please check your device settings.';
    case 'timeout':
      return 'Location request timed out. Please try again.';
    case 'unsupported':
      return 'Geolocation is not supported by your browser.';
    default:
      return 'Failed to get location.';
  }
}
