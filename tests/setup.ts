import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock requestAnimationFrame
let frameId = 0
vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
  frameId++
  setTimeout(() => callback(performance.now()), 16)
  return frameId
})

vi.stubGlobal('cancelAnimationFrame', (id: number) => {
  clearTimeout(id)
})

// Mock matchMedia
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)
