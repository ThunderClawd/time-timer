import { Season, getAllSeasons, getCurrentSeason } from '../themes/seasons';
import { Weather, getAllWeatherTypes } from '../themes/weather';

interface DebugPanelProps {
  currentSeason: Season;
  currentWeather: Weather;
  onSeasonChange: (season: Season) => void;
  onWeatherChange: (weather: Weather) => void;
  debugTime: number | null;
  onDebugTimeChange: (hour: number | null) => void;
  onClose: () => void;
}

export function DebugPanel({
  currentSeason,
  currentWeather,
  onSeasonChange,
  onWeatherChange,
  debugTime,
  onDebugTimeChange,
  onClose,
}: DebugPanelProps) {
  const detectedSeason = getCurrentSeason();
  const now = new Date();
  const currentHour = debugTime !== null ? debugTime : now.getHours();

  return (
    <div
      className="fixed top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50"
      style={{ minWidth: '220px' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Debug Panel</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close debug panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Current Detection Info */}
      <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
        <div className="text-gray-500 dark:text-gray-400">
          <div>Date: {now.toLocaleDateString()}</div>
          <div>Time: {now.toLocaleTimeString()}</div>
          <div>Detected Season: {detectedSeason}</div>
        </div>
      </div>

      {/* Season Selector */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Season</label>
        <select
          value={currentSeason}
          onChange={e => onSeasonChange(e.target.value as Season)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getAllSeasons().map(season => (
            <option key={season} value={season}>
              {season.charAt(0).toUpperCase() + season.slice(1)}
              {season === detectedSeason ? ' (auto)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Weather Selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Weather</label>
        <select
          value={currentWeather}
          onChange={e => onWeatherChange(e.target.value as Weather)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getAllWeatherTypes().map(weather => (
            <option key={weather} value={weather}>
              {weather.charAt(0).toUpperCase() + weather.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Season Buttons */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Quick Select</label>
        <div className="grid grid-cols-2 gap-1">
          {getAllSeasons().map(season => {
            const icons: Record<Season, string> = {
              spring: '\uD83C\uDF38',
              summer: '\u2600\uFE0F',
              autumn: '\uD83C\uDF42',
              winter: '\u2744\uFE0F',
            };
            return (
              <button
                key={season}
                onClick={() => onSeasonChange(season)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  currentSeason === season
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
              >
                {icons[season]} {season.charAt(0).toUpperCase() + season.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Weather Buttons */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Weather Effects</label>
        <div className="grid grid-cols-4 gap-1">
          {getAllWeatherTypes().map(weather => {
            const icons: Record<Weather, string> = {
              clear: '☀️',
              rainy: '🌧️',
              snowy: '🌨️',
              cloudy: '☁️',
            };
            return (
              <button
                key={weather}
                onClick={() => onWeatherChange(weather)}
                className={`px-1.5 py-1 text-xs rounded transition-colors ${
                  currentWeather === weather
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
              >
                {icons[weather]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Override Controls */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Time Override</label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={debugTime !== null}
              onChange={e => onDebugTimeChange(e.target.checked ? currentHour : null)}
              className="mr-1"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">Enable</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="23"
            value={currentHour}
            disabled={debugTime === null}
            onChange={e => onDebugTimeChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
          <span className="text-sm font-mono text-gray-700 dark:text-gray-200 min-w-[3.5rem]">
            {String(currentHour).padStart(2, '0')}:00
          </span>
        </div>
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {debugTime !== null ? `Testing sun/moon at ${currentHour}:00` : 'Using real time'}
        </div>
      </div>

      {/* URL hint */}
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          URL params: ?debug=true&season=winter&weather=snowy
        </p>
      </div>
    </div>
  );
}
