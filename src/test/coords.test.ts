import { describe, it, expect } from 'vitest'
import { isoToPixel, pixelToIso, snap, snapFloor, calcSpriteScale, pixelToIsoNearest } from '@/editor/coords'

describe('isoToPixel / pixelToIso round-trip', () => {
  const testCases = [
    { x: 0, y: 0 },
    { x: 5, y: 10 },
    { x: -3, y: 7 },
    { x: 50, y: 50 },
    { x: -100, y: -100 },
  ]

  for (const { x, y } of testCases) {
    it(`round-trip (${x}, ${y})`, () => {
      const pixel = isoToPixel(x, y)
      const iso = pixelToIso(pixel.x, pixel.y)
      expect(iso.x).toBeCloseTo(x, 9)
      expect(iso.y).toBeCloseTo(y, 9)
    })
  }
})

describe('snap', () => {
  it('snaps to integer grid by default', () => {
    expect(snap(0.3)).toBe(0)
    expect(snap(0.5)).toBe(1)
    expect(snap(1.7)).toBe(2)
    // Math.round(-0.3) returns -0 in JS; use toBeCloseTo for numeric equality
    expect(snap(-0.3)).toBeCloseTo(0, 10)
    expect(snap(-0.7)).toBe(-1)
  })

  it('snaps to custom step', () => {
    expect(snap(0.3, 0.5)).toBe(0.5)
    expect(snap(0.7, 0.5)).toBe(0.5)
    expect(snap(1.2, 0.5)).toBe(1)
    expect(snap(0.9, 2)).toBe(0)
    expect(snap(1.1, 2)).toBe(2)
  })

  it('snaps to step 0.5', () => {
    expect(snap(0.2, 0.5)).toBe(0)
    expect(snap(0.3, 0.5)).toBe(0.5)
    expect(snap(0.8, 0.5)).toBe(1)
  })
})

describe('calcSpriteScale', () => {
  it('calculates scale for 64x32 texture with no flip', () => {
    const result = calcSpriteScale(1, 1, false, 64, 32)
    expect(result.scaleX).toBeCloseTo(1, 5)
    expect(result.scaleY).toBeCloseTo(1, 5)
  })

  it('flips X when flipX is true', () => {
    const result = calcSpriteScale(1, 1, true, 64, 32)
    expect(result.scaleX).toBeCloseTo(-1, 5)
    expect(result.scaleY).toBeCloseTo(1, 5)
  })

  it('handles custom entity scale', () => {
    const result = calcSpriteScale(2, 0.5, false, 64, 32)
    expect(result.scaleX).toBeCloseTo(2, 5)
    expect(result.scaleY).toBeCloseTo(0.5, 5)
  })

  it('handles different texture dimensions', () => {
    const result = calcSpriteScale(1, 1, false, 128, 64)
    expect(result.scaleX).toBeCloseTo(0.5, 5)
    expect(result.scaleY).toBeCloseTo(0.5, 5)
  })
})

describe('snapFloor', () => {
  it('floors to integer grid', () => {
    expect(snapFloor(0.3)).toBe(0)
    expect(snapFloor(0.5)).toBe(0)
    expect(snapFloor(0.9)).toBe(0)
    expect(snapFloor(1.0)).toBe(1)
    expect(snapFloor(1.7)).toBe(1)
    expect(snapFloor(-0.3)).toBe(-1)
    expect(snapFloor(-0.7)).toBe(-1)
    expect(snapFloor(-1.2)).toBe(-2)
  })

  it('floors to custom step', () => {
    expect(snapFloor(0.3, 0.5)).toBe(0)
    expect(snapFloor(0.7, 0.5)).toBe(0.5)
    expect(snapFloor(1.2, 0.5)).toBe(1)
    expect(snapFloor(0.9, 2)).toBe(0)
    expect(snapFloor(1.1, 2)).toBe(0)
    expect(snapFloor(2.1, 2)).toBe(2)
  })
})

describe('pixelToIsoNearest', () => {
  it('returns exact cell for cell center', () => {
    const center = isoToPixel(5, 10)
    const iso = pixelToIsoNearest(center.x, center.y)
    expect(iso.x).toBe(5)
    expect(iso.y).toBe(10)
  })

  it('returns nearest cell for point near edge', () => {
    // Point slightly inside cell (5, 10) should still return (5, 10)
    const center = isoToPixel(5.4, 10.3)
    const iso = pixelToIsoNearest(center.x, center.y)
    expect(iso.x).toBe(5)
    expect(iso.y).toBe(10)
  })

  it('round-trips correctly', () => {
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const pixel = isoToPixel(x + 0.5, y + 0.5)
        const iso = pixelToIsoNearest(pixel.x, pixel.y)
        expect(iso.x).toBe(x)
        expect(iso.y).toBe(y)
      }
    }
  })
})
