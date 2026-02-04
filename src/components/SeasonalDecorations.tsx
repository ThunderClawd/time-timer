import { useEffect, useRef, useState, useMemo } from 'react';
import { Season, getSeasonConfig } from '../themes/seasons';
import {
  createFallingElements,
  updateFallingElement,
  FallingElement,
  getSwayOffset,
  getFloatOffset,
  getScalePulse,
} from '../themes/animations';
import type { DailyTheme, DecorativeElement } from '../themes/dailyThemes.types';

interface SeasonalDecorationsProps {
  season: Season;
  collectionTheme?: DailyTheme | null;
}

// SVG decorations for each season
const DecorationSVGs: Record<string, (color?: string) => JSX.Element> = {
  // Spring decorations
  'cherry-blossom': (color = '#FFB6C1') => (
    <svg viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C11 4 9 6 7 6C9 6 11 8 12 10C13 8 15 6 17 6C15 6 13 4 12 2Z" />
      <path d="M12 10C10 11 8 11 6 10C8 11 9 13 9 15C10 13 12 12 14 12C12 12 11 10 12 10Z" opacity="0.8" />
      <path d="M12 10C14 11 16 11 18 10C16 11 15 13 15 15C14 13 12 12 10 12C12 12 13 10 12 10Z" opacity="0.8" />
      <circle cx="12" cy="8" r="2" fill="#FFD700" />
    </svg>
  ),
  tulip: (color = '#FF69B4') => (
    <svg viewBox="0 0 24 24">
      <path d="M12 4C10 4 8 6 8 9C8 11 10 13 12 13C14 13 16 11 16 9C16 6 14 4 12 4Z" fill={color} />
      <path d="M12 13V20" stroke="#228B22" strokeWidth="2" />
      <path d="M8 16C10 15 12 16 12 16C12 16 14 15 16 16" stroke="#228B22" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  butterfly: (color = '#DDA0DD') => (
    <svg viewBox="0 0 24 24">
      <ellipse cx="8" cy="8" rx="5" ry="4" fill={color} opacity="0.8" transform="rotate(-30 8 8)" />
      <ellipse cx="16" cy="8" rx="5" ry="4" fill={color} opacity="0.8" transform="rotate(30 16 8)" />
      <ellipse cx="9" cy="14" rx="4" ry="3" fill={color} opacity="0.6" transform="rotate(-20 9 14)" />
      <ellipse cx="15" cy="14" rx="4" ry="3" fill={color} opacity="0.6" transform="rotate(20 15 14)" />
      <ellipse cx="12" cy="12" rx="1" ry="5" fill="#4A4A4A" />
      <path d="M11 7 Q10 5 9 4" stroke="#4A4A4A" strokeWidth="0.5" fill="none" />
      <path d="M13 7 Q14 5 15 4" stroke="#4A4A4A" strokeWidth="0.5" fill="none" />
    </svg>
  ),
  sprout: (color = '#90EE90') => (
    <svg viewBox="0 0 24 24">
      <path d="M12 20V12" stroke="#228B22" strokeWidth="2" />
      <path d="M12 12C12 12 8 10 8 6C12 8 12 12 12 12Z" fill={color} />
      <path d="M12 14C12 14 16 12 16 8C12 10 12 14 12 14Z" fill={color} />
    </svg>
  ),

  // Summer decorations
  sun: (color = '#FFD700') => (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line
          key={i}
          x1={12 + Math.cos((angle * Math.PI) / 180) * 7}
          y1={12 + Math.sin((angle * Math.PI) / 180) * 7}
          x2={12 + Math.cos((angle * Math.PI) / 180) * 10}
          y2={12 + Math.sin((angle * Math.PI) / 180) * 10}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  ),
  cloud: (color = '#FFFFFF') => (
    <svg viewBox="0 0 24 24">
      <ellipse cx="8" cy="14" rx="5" ry="4" fill={color} />
      <ellipse cx="14" cy="12" rx="6" ry="5" fill={color} />
      <ellipse cx="18" cy="14" rx="4" ry="3" fill={color} />
    </svg>
  ),
  seashell: (color = '#FFEFD5') => (
    <svg viewBox="0 0 24 24">
      <path
        d="M12 4C8 4 4 8 4 14C4 18 8 20 12 20C16 20 20 18 20 14C20 8 16 4 12 4Z"
        fill={color}
        stroke="#DEB887"
        strokeWidth="0.5"
      />
      <path d="M12 6C12 6 10 10 10 14" stroke="#DEB887" strokeWidth="0.5" fill="none" />
      <path d="M12 6C12 6 14 10 14 14" stroke="#DEB887" strokeWidth="0.5" fill="none" />
      <path d="M12 6C12 6 8 12 8 16" stroke="#DEB887" strokeWidth="0.5" fill="none" />
      <path d="M12 6C12 6 16 12 16 16" stroke="#DEB887" strokeWidth="0.5" fill="none" />
    </svg>
  ),
  'palm-leaf': (color = '#228B22') => (
    <svg viewBox="0 0 24 24">
      <path d="M4 20C4 20 8 16 12 8C16 16 20 20 20 20" stroke={color} strokeWidth="2" fill="none" />
      <path d="M12 8L10 4" stroke={color} strokeWidth="1.5" />
      <path d="M12 8L14 4" stroke={color} strokeWidth="1.5" />
      <path d="M10 12L6 10" stroke={color} strokeWidth="1" />
      <path d="M14 12L18 10" stroke={color} strokeWidth="1" />
    </svg>
  ),

  // Autumn decorations
  'maple-leaf': (color = '#D2691E') => (
    <svg viewBox="0 0 24 24">
      <path
        d="M12 2L14 6L18 4L16 8L20 10L16 12L18 16L14 14L12 20L10 14L6 16L8 12L4 10L8 8L6 4L10 6L12 2Z"
        fill={color}
      />
      <path d="M12 8V18" stroke="#8B4513" strokeWidth="1" />
    </svg>
  ),
  'oak-leaf': (color = '#CD853F') => (
    <svg viewBox="0 0 24 24">
      <path
        d="M12 4C10 6 8 6 6 8C8 8 8 10 6 12C8 12 8 14 6 16C8 16 10 18 12 20C14 18 16 16 18 16C16 14 16 12 18 12C16 10 16 8 18 8C16 6 14 6 12 4Z"
        fill={color}
      />
      <path d="M12 8V18" stroke="#8B4513" strokeWidth="1" />
    </svg>
  ),
  acorn: (color = '#8B4513') => (
    <svg viewBox="0 0 24 24">
      <ellipse cx="12" cy="14" rx="5" ry="6" fill="#DEB887" />
      <path d="M7 10C7 10 7 6 12 6C17 6 17 10 17 10Z" fill={color} />
      <rect x="11" y="3" width="2" height="4" fill={color} />
    </svg>
  ),
  pumpkin: (color = '#FF7F00') => (
    <svg viewBox="0 0 24 24">
      <ellipse cx="12" cy="14" rx="8" ry="6" fill={color} />
      <path d="M12 8C12 8 10 6 10 4C10 4 12 5 12 5C12 5 14 4 14 4C14 6 12 8 12 8Z" fill="#228B22" />
      <path d="M8 14C8 14 8 10 12 10" stroke="#FF6600" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M16 14C16 14 16 10 12 10" stroke="#FF6600" strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
  ),

  // Winter decorations
  snowflake: (color = '#B0E0E6') => (
    <svg viewBox="0 0 24 24">
      <line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="2" />
      <line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" />
      <line x1="5" y1="5" x2="19" y2="19" stroke={color} strokeWidth="1.5" />
      <line x1="19" y1="5" x2="5" y2="19" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="6" r="1.5" fill={color} />
      <circle cx="12" cy="18" r="1.5" fill={color} />
      <circle cx="6" cy="12" r="1.5" fill={color} />
      <circle cx="18" cy="12" r="1.5" fill={color} />
    </svg>
  ),
  icicle: (color = '#E0FFFF') => (
    <svg viewBox="0 0 24 24">
      <path d="M8 2L6 16L8 14L10 18L8 2Z" fill={color} opacity="0.8" />
      <path d="M14 2L12 20L14 16L16 22L14 2Z" fill={color} opacity="0.9" />
      <path d="M20 2L18 12L20 10L22 14L20 2Z" fill={color} opacity="0.7" />
    </svg>
  ),
  snowman: (color = '#FFFFFF') => (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="17" r="5" fill={color} stroke="#DDD" strokeWidth="0.5" />
      <circle cx="12" cy="9" r="3.5" fill={color} stroke="#DDD" strokeWidth="0.5" />
      <circle cx="12" cy="3" r="2" fill={color} stroke="#DDD" strokeWidth="0.5" />
      <circle cx="11" cy="2.5" r="0.3" fill="#333" />
      <circle cx="13" cy="2.5" r="0.3" fill="#333" />
      <path d="M11.5 3.5C11.5 3.5 12 4 12.5 3.5" stroke="#333" strokeWidth="0.3" fill="none" />
      <circle cx="12" cy="8" r="0.4" fill="#333" />
      <circle cx="12" cy="9.5" r="0.4" fill="#333" />
      <path d="M10 1L14 1" stroke="#8B4513" strokeWidth="1" />
    </svg>
  ),
  'pine-tree': (color = '#228B22') => (
    <svg viewBox="0 0 24 24">
      <path d="M12 2L6 10H8L4 16H9L7 22H17L15 16H20L16 10H18L12 2Z" fill={color} />
      <rect x="10" y="20" width="4" height="4" fill="#8B4513" />
    </svg>
  ),

  // Collection theme decorations
  snowmen: (color = '#FFFFFF') => (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="17" r="5" fill={color} stroke="#DDD" strokeWidth="0.5" />
      <circle cx="12" cy="9" r="3.5" fill={color} stroke="#DDD" strokeWidth="0.5" />
      <circle cx="12" cy="3" r="2" fill={color} stroke="#DDD" strokeWidth="0.5" />
      <circle cx="11" cy="2.5" r="0.3" fill="#333" />
      <circle cx="13" cy="2.5" r="0.3" fill="#333" />
      <path d="M11.5 3.5C11.5 3.5 12 4 12.5 3.5" stroke="#333" strokeWidth="0.3" fill="none" />
      <circle cx="12" cy="8" r="0.4" fill="#333" />
      <circle cx="12" cy="9.5" r="0.4" fill="#333" />
      <path d="M10 1L14 1" stroke="#8B4513" strokeWidth="1" />
    </svg>
  ),
  flowers: (color = '#FF69B4') => (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" fill="#FFD700" />
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <ellipse
          key={i}
          cx={12 + Math.cos((angle * Math.PI) / 180) * 5}
          cy={12 + Math.sin((angle * Math.PI) / 180) * 5}
          rx="3"
          ry="4"
          fill={color}
          transform={`rotate(${angle}, ${12 + Math.cos((angle * Math.PI) / 180) * 5}, ${12 + Math.sin((angle * Math.PI) / 180) * 5})`}
        />
      ))}
    </svg>
  ),
  hearts: (color = '#FF6B6B') => (
    <svg viewBox="0 0 24 24">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={color}
      />
    </svg>
  ),
  stars: (color = '#FFD700') => (
    <svg viewBox="0 0 24 24">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={color}
      />
    </svg>
  ),
  moons: (color = '#F4E99B') => (
    <svg viewBox="0 0 24 24">
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        fill={color}
      />
    </svg>
  ),
  suns: (color = '#FFD700') => (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line
          key={i}
          x1={12 + Math.cos((angle * Math.PI) / 180) * 7}
          y1={12 + Math.sin((angle * Math.PI) / 180) * 7}
          x2={12 + Math.cos((angle * Math.PI) / 180) * 10}
          y2={12 + Math.sin((angle * Math.PI) / 180) * 10}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  ),
  clouds: (color = '#FFFFFF') => (
    <svg viewBox="0 0 24 24">
      <ellipse cx="8" cy="14" rx="5" ry="4" fill={color} />
      <ellipse cx="14" cy="12" rx="6" ry="5" fill={color} />
      <ellipse cx="18" cy="14" rx="4" ry="3" fill={color} />
    </svg>
  ),
  trees: (color = '#228B22') => (
    <svg viewBox="0 0 24 24">
      <path d="M12 2L6 12H9L5 20H19L15 12H18L12 2Z" fill={color} />
      <rect x="10" y="18" width="4" height="4" fill="#8B4513" />
    </svg>
  ),
  mountains: (color = '#6B7280') => (
    <svg viewBox="0 0 24 24">
      <path d="M2 20L8 8L12 14L16 6L22 20H2Z" fill={color} />
      <path d="M16 6L18 10L20 8L22 20H14L16 6Z" fill="#9CA3AF" />
    </svg>
  ),
  waves: (color = '#3B82F6') => (
    <svg viewBox="0 0 24 24">
      <path d="M2 12C4 10 6 14 8 12C10 10 12 14 14 12C16 10 18 14 20 12C22 10 22 12 22 12" stroke={color} strokeWidth="2" fill="none" />
      <path d="M2 16C4 14 6 18 8 16C10 14 12 18 14 16C16 14 18 18 20 16C22 14 22 16 22 16" stroke={color} strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  ),
  birds: (color = '#374151') => (
    <svg viewBox="0 0 24 24">
      <path d="M3 8C5 6 7 6 9 8" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M15 6C17 4 19 4 21 6" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  ),
  butterflies: (color = '#DDA0DD') => (
    <svg viewBox="0 0 24 24">
      <ellipse cx="8" cy="8" rx="5" ry="4" fill={color} opacity="0.8" transform="rotate(-30 8 8)" />
      <ellipse cx="16" cy="8" rx="5" ry="4" fill={color} opacity="0.8" transform="rotate(30 16 8)" />
      <ellipse cx="9" cy="14" rx="4" ry="3" fill={color} opacity="0.6" transform="rotate(-20 9 14)" />
      <ellipse cx="15" cy="14" rx="4" ry="3" fill={color} opacity="0.6" transform="rotate(20 15 14)" />
      <ellipse cx="12" cy="12" rx="1" ry="5" fill="#4A4A4A" />
    </svg>
  ),
  lanterns: (color = '#F59E0B') => (
    <svg viewBox="0 0 24 24">
      <rect x="8" y="4" width="8" height="16" rx="2" fill={color} />
      <rect x="10" y="2" width="4" height="2" fill="#92400E" />
      <path d="M7 8H17M7 16H17" stroke="#92400E" strokeWidth="0.5" />
      <ellipse cx="12" cy="12" rx="2" ry="4" fill="#FDE68A" opacity="0.6" />
    </svg>
  ),
  candles: (color = '#FAFAF9') => (
    <svg viewBox="0 0 24 24">
      <rect x="9" y="10" width="6" height="12" fill={color} />
      <ellipse cx="12" cy="10" rx="3" ry="1" fill={color} />
      <path d="M12 3C12 3 10 6 12 8C14 6 12 3 12 3Z" fill="#F59E0B" />
      <rect x="11.5" y="7" width="1" height="3" fill="#78716C" />
    </svg>
  ),
  pumpkins: (color = '#FF7F00') => (
    <svg viewBox="0 0 24 24">
      <ellipse cx="12" cy="14" rx="8" ry="6" fill={color} />
      <path d="M12 8C12 8 10 6 10 4C10 4 12 5 12 5C12 5 14 4 14 4C14 6 12 8 12 8Z" fill="#228B22" />
      <path d="M8 14C8 14 8 10 12 10" stroke="#FF6600" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M16 14C16 14 16 10 12 10" stroke="#FF6600" strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
  ),
  eggs: (color = '#F0E68C') => (
    <svg viewBox="0 0 24 24">
      <ellipse cx="12" cy="13" rx="6" ry="8" fill={color} />
      <path d="M8 11C10 13 14 13 16 11" stroke="#FF69B4" strokeWidth="1" fill="none" />
      <path d="M8 15C10 17 14 17 16 15" stroke="#87CEEB" strokeWidth="1" fill="none" />
    </svg>
  ),
  presents: (color = '#EF4444') => (
    <svg viewBox="0 0 24 24">
      <rect x="4" y="10" width="16" height="12" fill={color} />
      <rect x="4" y="8" width="16" height="4" fill="#DC2626" />
      <rect x="11" y="8" width="2" height="14" fill="#FDE68A" />
      <rect x="4" y="9" width="16" height="2" fill="#FDE68A" />
      <path d="M12 8C10 6 8 6 8 4C8 4 10 4 12 6C14 4 16 4 16 4C16 6 14 6 12 8Z" fill="#FDE68A" />
    </svg>
  ),
  fireworks: (color = '#F59E0B') => (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="2" fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line
          key={i}
          x1={12 + Math.cos((angle * Math.PI) / 180) * 3}
          y1={12 + Math.sin((angle * Math.PI) / 180) * 3}
          x2={12 + Math.cos((angle * Math.PI) / 180) * 8}
          y2={12 + Math.sin((angle * Math.PI) / 180) * 8}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
      <circle cx="12" cy="4" r="1" fill="#EF4444" />
      <circle cx="20" cy="12" r="1" fill="#3B82F6" />
      <circle cx="4" cy="12" r="1" fill="#10B981" />
    </svg>
  ),
  crystals: (color = '#A78BFA') => (
    <svg viewBox="0 0 24 24">
      <path d="M12 2L16 10L12 22L8 10L12 2Z" fill={color} opacity="0.8" />
      <path d="M12 2L16 10L12 22" fill={color} />
      <path d="M8 10L12 6L16 10" stroke="#DDD6FE" strokeWidth="0.5" fill="none" />
    </svg>
  ),
  mushrooms: (color = '#EF4444') => (
    <svg viewBox="0 0 24 24">
      <ellipse cx="12" cy="10" rx="8" ry="6" fill={color} />
      <rect x="10" y="14" width="4" height="6" fill="#FAFAF9" />
      <circle cx="9" cy="8" r="1.5" fill="#FAFAF9" />
      <circle cx="14" cy="9" r="1" fill="#FAFAF9" />
      <circle cx="11" cy="11" r="0.8" fill="#FAFAF9" />
    </svg>
  ),
  leaves: (color = '#22C55E') => (
    <svg viewBox="0 0 24 24">
      <path d="M12 2C8 6 4 10 4 14C4 18 8 22 12 22C16 22 20 18 20 14C20 10 16 6 12 2Z" fill={color} />
      <path d="M12 6V18M8 10C10 12 14 12 16 10" stroke="#166534" strokeWidth="1" fill="none" />
    </svg>
  ),
  bats: (color = '#1F2937') => (
    <svg viewBox="0 0 24 24">
      <ellipse cx="12" cy="12" rx="2" ry="3" fill={color} />
      <path d="M10 10C8 8 4 8 2 12C4 10 6 12 10 12Z" fill={color} />
      <path d="M14 10C16 8 20 8 22 12C20 10 18 12 14 12Z" fill={color} />
      <circle cx="11" cy="10" r="0.5" fill="#FFF" />
      <circle cx="13" cy="10" r="0.5" fill="#FFF" />
    </svg>
  ),
};

// Get decoration component
function getDecoration(type: string, color: string | undefined = '#6366f1'): JSX.Element | null {
  const decorationFn = DecorationSVGs[type];
  if (decorationFn) {
    return decorationFn(color);
  }
  return null;
}

// Map collection theme decorative elements to SVG decoration types
const decorativeElementToSvg: Record<DecorativeElement, string> = {
  snowmen: 'snowmen',
  flowers: 'flowers',
  hearts: 'hearts',
  stars: 'stars',
  moons: 'moons',
  suns: 'suns',
  clouds: 'clouds',
  trees: 'trees',
  mountains: 'mountains',
  waves: 'waves',
  birds: 'birds',
  butterflies: 'butterflies',
  lanterns: 'lanterns',
  candles: 'candles',
  pumpkins: 'pumpkins',
  eggs: 'eggs',
  presents: 'presents',
  fireworks: 'fireworks',
  crystals: 'crystals',
  mushrooms: 'mushrooms',
  leaves: 'leaves',
  none: '',
};

// Generate random positions for decorative elements
function generateDecorationPositions(count: number): Array<{ x: number; y: number; scale: number; rotation: number }> {
  const positions: Array<{ x: number; y: number; scale: number; rotation: number }> = [];
  // Place decorations around the edges
  const edgePositions = [
    // Top edge
    { x: 10, y: 5 }, { x: 30, y: 8 }, { x: 70, y: 6 }, { x: 90, y: 7 },
    // Bottom edge
    { x: 8, y: 92 }, { x: 25, y: 95 }, { x: 75, y: 93 }, { x: 92, y: 94 },
    // Left edge
    { x: 5, y: 25 }, { x: 6, y: 50 }, { x: 4, y: 75 },
    // Right edge
    { x: 95, y: 30 }, { x: 94, y: 55 }, { x: 96, y: 80 },
  ];

  for (let i = 0; i < count && i < edgePositions.length; i++) {
    const pos = edgePositions[i];
    if (!pos) continue;
    positions.push({
      x: pos.x,
      y: pos.y,
      scale: 0.8 + Math.random() * 0.4,
      rotation: Math.random() * 30 - 15,
    });
  }
  return positions;
}

export function SeasonalDecorations({ season, collectionTheme }: SeasonalDecorationsProps) {
  const config = getSeasonConfig(season);
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);
  const [fallingElements, setFallingElements] = useState<FallingElement[]>([]);

  // Determine which decorations to use
  const useCollectionDecorations = collectionTheme &&
    collectionTheme.decorativeElements &&
    collectionTheme.decorativeElements.length > 0 &&
    !collectionTheme.decorativeElements.includes('none');

  // Generate positions for collection theme decorations
  const collectionDecorationPositions = useMemo(() => {
    if (!useCollectionDecorations) return [];
    return generateDecorationPositions(10);
  }, [useCollectionDecorations]);

  // Initialize falling elements based on season (only when not using collection theme)
  useEffect(() => {
    if (useCollectionDecorations) {
      setFallingElements([]);
      return;
    }

    const fallingTypes: Record<Season, string[]> = {
      spring: ['cherry-blossom'],
      summer: [],
      autumn: ['maple-leaf', 'oak-leaf'],
      winter: [],
    };

    const types = fallingTypes[season];
    if (types.length > 0) {
      setFallingElements(createFallingElements(season === 'autumn' ? 8 : 6, types));
    } else {
      setFallingElements([]);
    }
  }, [season, useCollectionDecorations]);

  // Animation loop
  useEffect(() => {
    let animationId: number;
    let lastTime = 0;

    const animate = (currentTime: number) => {
      const deltaTime = lastTime ? (currentTime - lastTime) / 1000 : 0.016;
      lastTime = currentTime;

      setTime(currentTime);

      if (fallingElements.length > 0) {
        setFallingElements(prev =>
          prev.map(el => updateFallingElement(el, deltaTime, season === 'autumn' ? 0.3 : 0.2))
        );
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [fallingElements.length, season]);

  // Get color from collection theme or season config
  const decorationColor = collectionTheme?.colors.accent || config.colors.primary || '#6366f1';

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {/* Collection theme decorations */}
      {useCollectionDecorations && collectionTheme && collectionDecorationPositions.map((pos, index) => {
        const elementTypes = collectionTheme.decorativeElements.filter(e => e !== 'none');
        if (elementTypes.length === 0) return null;
        const selectedElement = elementTypes[index % elementTypes.length];
        if (!selectedElement) return null;
        const elementType = decorativeElementToSvg[selectedElement];
        if (!elementType) return null;

        const swayX = getSwayOffset(time, index);
        const floatY = getFloatOffset(time, index + 5);
        const scale = getScalePulse(time, index, pos.scale * 0.95, pos.scale * 1.05);

        return (
          <div
            key={`collection-${index}`}
            className="absolute transition-opacity duration-1000"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: '32px',
              height: '32px',
              transform: `
                translate(-50%, -50%)
                translate(${swayX}px, ${floatY}px)
                rotate(${pos.rotation}deg)
                scale(${scale})
              `,
              opacity: 0.85,
            }}
          >
            {getDecoration(elementType, decorationColor)}
          </div>
        );
      })}

      {/* Seasonal decorations around the edges (when not using collection theme) */}
      {!useCollectionDecorations && config.decorations.positions.map((pos, index) => {
        const elementType = config.decorations.elements[index % config.decorations.elements.length] || 'default';
        const swayX = getSwayOffset(time, index);
        const floatY = getFloatOffset(time, index + 5);
        const scale = getScalePulse(time, index, pos.scale * 0.95, pos.scale * 1.05);

        return (
          <div
            key={`static-${index}`}
            className="absolute transition-opacity duration-1000"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: '32px',
              height: '32px',
              transform: `
                translate(-50%, -50%)
                translate(${swayX}px, ${floatY}px)
                rotate(${pos.rotation}deg)
                scale(${scale})
              `,
              opacity: 0.85,
            }}
          >
            {getDecoration(elementType, decorationColor)}
          </div>
        );
      })}

      {/* Falling elements (petals, leaves) - only for seasonal decorations */}
      {!useCollectionDecorations && fallingElements.map((el, index) => (
        <div
          key={`falling-${index}`}
          className="absolute"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: '20px',
            height: '20px',
            transform: `
              translate(-50%, -50%)
              rotate(${el.rotation}deg)
              scale(${el.scale})
            `,
            opacity: el.opacity,
          }}
        >
          {getDecoration(el.type, decorationColor)}
        </div>
      ))}
    </div>
  );
}
