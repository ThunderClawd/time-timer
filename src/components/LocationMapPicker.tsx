import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LocationMapPickerProps {
  initialPosition?: { latitude: number; longitude: number }
  onLocationSelect: (latitude: number, longitude: number) => void
  onClose: () => void
}

function LocationMarker({
  onLocationSelect,
  initialPosition,
}: {
  onLocationSelect: (lat: number, lng: number) => void
  initialPosition?: { latitude: number; longitude: number }
}) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialPosition ? L.latLng(initialPosition.latitude, initialPosition.longitude) : null
  )

  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })

  return position === null ? null : <Marker position={position} />
}

export function LocationMapPicker({
  initialPosition,
  onLocationSelect,
  onClose,
}: LocationMapPickerProps) {
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    initialPosition ? { lat: initialPosition.latitude, lng: initialPosition.longitude } : null
  )

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng })
  }

  const handleConfirm = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords.lat, selectedCoords.lng)
      onClose()
    }
  }

  const defaultCenter: [number, number] = initialPosition
    ? [initialPosition.latitude, initialPosition.longitude]
    : [20, 0] // Center of world map

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Map Modal */}
      <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select Location
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Click anywhere on the map to set your location
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close map"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Map */}
        <div className="relative" style={{ height: '500px' }}>
          <MapContainer
            center={defaultCenter}
            zoom={initialPosition ? 10 : 2}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
              onLocationSelect={handleLocationSelect}
              initialPosition={initialPosition}
            />
          </MapContainer>

          {/* Coordinates Display */}
          {selectedCoords && (
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg z-[1000]">
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                📍 {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedCoords
              ? 'Click "Confirm Location" to use this position'
              : 'Click on the map to select a location'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedCoords}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
