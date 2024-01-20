import { describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.212.0/expect/mod.ts'
import { Deduplicator } from '@src/deduplicator.ts'
import { toString } from 'https://esm.sh/@blackglory/prelude@0.3.4'

describe('Deduplicator', () => {
  it('create, close', async () => {
    const deduplicator = await Deduplicator.create()

    deduplicator.close()
  })

  describe('add', () => {
    it('default', async () => {
      const deduplicator = await Deduplicator.create<string>()

      await deduplicator.add([])
      await deduplicator.add(['foo', 'bar'])

      expect(await deduplicator.diff(['foo', 'bar'])).toStrictEqual([])
    })

    it('with custom hash', async () => {
      const deduplicator = await Deduplicator.create<string | number>({
        hash: toString
      })

      await deduplicator.add([123])

      expect(await deduplicator.diff(['123'])).toStrictEqual([])
    })

    it('with shrink', async () => {
      const deduplicator = await Deduplicator.create<number>({
        shrink: {
          target: 1
        , threshold: 2
        }
      })

      await deduplicator.add([1, 2])

      expect(await deduplicator.diff([1, 2])).toStrictEqual([1])
    })
  })

  describe('diff', () => {
    it('default', async () => {
      const deduplicator = await Deduplicator.create<string>()

      const result1 = await deduplicator.diff([])
      const result2 = await deduplicator.diff(['foo'])
      const result3 = await deduplicator.diff(['foo', 'bar'])

      expect(result1).toStrictEqual([])
      expect(result2).toStrictEqual(['foo'])
      expect(result3).toStrictEqual(['bar'])
    })

    it('edge: same elements', async () => {
      const deduplicator = await Deduplicator.create<string>()

      const result = await deduplicator.diff(['foo', 'bar', 'foo'])

      expect(result).toStrictEqual(['foo', 'bar'])
    })

    it('with custom hash', async () => {
      const deduplicator = await Deduplicator.create<string | number>({
        hash: toString
      })

      const result1 = await deduplicator.diff([123])
      const result2 = await deduplicator.diff(['123', 456])

      expect(result1).toStrictEqual([123])
      expect(result2).toStrictEqual([456])
    })

    it('with shrink', async () => {
      const deduplicator = await Deduplicator.create<number>({
        shrink: {
          target: 1
        , threshold: 2
        }
      })

      const result1 = await deduplicator.diff([1, 2])
      const result2 = await deduplicator.diff([1, 2])

      expect(result1).toStrictEqual([1, 2])
      expect(result2).toStrictEqual([1])
    })
  })

  describe('lastDiff', () => {
    it('default', async () => {
      const deduplicator = await Deduplicator.create<string>()

      const result1 = await deduplicator.lastDiff('foo')
      const result2 = await deduplicator.lastDiff('foo')
      const result3 = await deduplicator.lastDiff('bar')

      expect(result1).toBe(true)
      expect(result2).toBe(false)
      expect(result3).toBe(true)
    })

    it('with custom hash', async () => {
      const deduplicator = await Deduplicator.create<string | number>({
        hash: toString
      })

      const result1 = await deduplicator.lastDiff(123)
      const result2 = await deduplicator.lastDiff('123')
      const result3 = await deduplicator.lastDiff(456)

      expect(result1).toBe(true)
      expect(result2).toBe(false)
      expect(result3).toBe(true)
    })

    it('with shrink', async () => {
      const deduplicator = await Deduplicator.create<number>({
        shrink: {
          target: 1
        , threshold: 2
        }
      })
      await deduplicator.add([1])

      const result = await deduplicator.lastDiff(2)

      expect(result).toBe(true)
      expect(await deduplicator.diff([1, 2])).toStrictEqual([1])
    })
  })
})
