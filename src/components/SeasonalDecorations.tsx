import { useEffect, useRef, useState } from 'react';
import { Season, getSeasonConfig } from '../themes/seasons';
import {
  createFallingElements,
  updateFallingElement,
  FallingElement,
  getSwayOffset,
  getFloatOffset,
  getScalePulse,
} from '../themes/animations';

interface SeasonalDecorationsProps {
  season: Season;
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
};

// Get decoration component
function getDecoration(type: string, color: string | undefined = '#6366f1'): JSX.Element | null {
  const decorationFn = DecorationSVGs[type];
  if (decorationFn) {
    return decorationFn(color);
  }
  return null;
}

export function SeasonalDecorations({ season }: SeasonalDecorationsProps) {
  const config = getSeasonConfig(season);
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);
  const [fallingElements, setFallingElements] = useState<FallingElement[]>([]);

  // Initialize falling elements based on season
  useEffect(() => {
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
  }, [season]);

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

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {/* Static decorations around the edges */}
      {config.decorations.positions.map((pos, index) => {
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
            {getDecoration(elementType, config.colors.primary || '#6366f1')}
          </div>
        );
      })}

      {/* Falling elements (petals, leaves) */}
      {fallingElements.map((el, index) => (
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
          {getDecoration(el.type, config.colors.primary || '#6366f1')}
        </div>
      ))}
    </div>
  );
}
