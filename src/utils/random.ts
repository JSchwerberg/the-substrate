/**
 * Seeded pseudo-random number generator using Mulberry32 algorithm
 * Provides deterministic random numbers for reproducible procedural generation
 */
export class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed
  }

  /**
   * Returns a random float between 0 (inclusive) and 1 (exclusive)
   */
  next(): number {
    this.state |= 0
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /**
   * Returns true with the given probability (0-1)
   */
  chance(probability: number): boolean {
    return this.next() < probability
  }

  /**
   * Shuffles an array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i)
      const temp = array[i]
      const swapVal = array[j]
      if (temp !== undefined && swapVal !== undefined) {
        array[i] = swapVal
        array[j] = temp
      }
    }
    return array
  }

  /**
   * Picks a random element from an array
   */
  pick<T>(array: readonly T[]): T | undefined {
    if (array.length === 0) return undefined
    return array[this.nextInt(0, array.length - 1)]
  }

  /**
   * Creates a seed from a string (for named sectors)
   */
  static seedFromString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0
    }
    return Math.abs(hash)
  }
}
