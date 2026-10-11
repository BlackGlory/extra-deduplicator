import { describe, test, expect } from 'vitest'
import { Deduplicator } from '@src/deduplicator.js'
import { toString } from '@blackglory/prelude'

describe('Deduplicator', () => {
  test('create, close', async () => {
    const deduplicator = await Deduplicator.create()

    deduplicator.close()
  })

  describe('add', () => {
    test('default', async () => {
      const deduplicator = await Deduplicator.create<string>()

      await deduplicator.add([])
      await deduplicator.add(['foo', 'bar'])

      expect(await deduplicator.addAndDiff(['foo', 'bar'])).toStrictEqual([])
    })

    test('with custom hash', async () => {
      const deduplicator = await Deduplicator.create<string | number>({
        hash: toString
      })

      await deduplicator.add([123])

      expect(await deduplicator.addAndDiff(['123'])).toStrictEqual([])
    })

    test('with shrink', async () => {
      const deduplicator = await Deduplicator.create<number>({
        shrink: {
          target: 1
        , threshold: 2
        }
      })

      await deduplicator.add([1, 2])

      expect(await deduplicator.addAndDiff([1, 2])).toStrictEqual([1])
    })
  })

  describe('diff', () => {
    test('default', async () => {
      const deduplicator = await Deduplicator.create<string>()
      await deduplicator.add(['foo'])

      const result1 = await deduplicator.diff(['foo', 'bar'])
      const result2 = await deduplicator.diff(['foo', 'bar'])

      expect(result1).toStrictEqual(['bar'])
      expect(result2).toStrictEqual(['bar'])
    })

    test('edge: same elements', async () => {
      const deduplicator = await Deduplicator.create<string>()

      const result = await deduplicator.diff(['foo', 'bar', 'foo'])

      expect(result).toStrictEqual(['foo', 'bar'])
    })

    test('with custom hash', async () => {
      const deduplicator = await Deduplicator.create<string | number>({
        hash: toString
      })
      await deduplicator.add([123])

      const result = await deduplicator.diff(['123', 456])

      expect(result).toStrictEqual([456])
    })
  })

  describe('diffLast', () => {
    test('default', async () => {
      const deduplicator = await Deduplicator.create<string>()
      await deduplicator.add(['foo'])

      const result1 = await deduplicator.diffLast('foo')
      const result2 = await deduplicator.diffLast('bar')
      const result3 = await deduplicator.diffLast('bar')

      expect(result1).toBe(false)
      expect(result2).toBe(true)
      expect(result3).toBe(true)
    })

    test('with custom hash', async () => {
      const deduplicator = await Deduplicator.create<string | number>({
        hash: toString
      })
      await deduplicator.add([123])

      const result1 = await deduplicator.diffLast('123')
      const result2 = await deduplicator.diffLast(456)

      expect(result1).toBe(false)
      expect(result2).toBe(true)
    })
  })

  describe('addAndDiff', () => {
    test('default', async () => {
      const deduplicator = await Deduplicator.create<string>()

      const result1 = await deduplicator.addAndDiff([])
      const result2 = await deduplicator.addAndDiff(['foo'])
      const result3 = await deduplicator.addAndDiff(['foo', 'bar'])

      expect(result1).toStrictEqual([])
      expect(result2).toStrictEqual(['foo'])
      expect(result3).toStrictEqual(['bar'])
    })

    test('edge: same elements', async () => {
      const deduplicator = await Deduplicator.create<string>()

      const result = await deduplicator.addAndDiff(['foo', 'bar', 'foo'])

      expect(result).toStrictEqual(['foo', 'bar'])
    })

    test('with custom hash', async () => {
      const deduplicator = await Deduplicator.create<string | number>({
        hash: toString
      })

      const result1 = await deduplicator.addAndDiff([123])
      const result2 = await deduplicator.addAndDiff(['123', 456])

      expect(result1).toStrictEqual([123])
      expect(result2).toStrictEqual([456])
    })

    test('with shrink', async () => {
      const deduplicator = await Deduplicator.create<number>({
        shrink: {
          target: 1
        , threshold: 2
        }
      })

      const result1 = await deduplicator.addAndDiff([1, 2])
      const result2 = await deduplicator.addAndDiff([1, 2])

      expect(result1).toStrictEqual([1, 2])
      expect(result2).toStrictEqual([1])
    })
  })

  describe('addAndDiffLast', () => {
    test('default', async () => {
      const deduplicator = await Deduplicator.create<string>()

      const result1 = await deduplicator.addAndDiffLast('foo')
      const result2 = await deduplicator.addAndDiffLast('foo')
      const result3 = await deduplicator.addAndDiffLast('bar')

      expect(result1).toBe(true)
      expect(result2).toBe(false)
      expect(result3).toBe(true)
    })

    test('with custom hash', async () => {
      const deduplicator = await Deduplicator.create<string | number>({
        hash: toString
      })

      const result1 = await deduplicator.addAndDiffLast(123)
      const result2 = await deduplicator.addAndDiffLast('123')
      const result3 = await deduplicator.addAndDiffLast(456)

      expect(result1).toBe(true)
      expect(result2).toBe(false)
      expect(result3).toBe(true)
    })

    test('with shrink', async () => {
      const deduplicator = await Deduplicator.create<number>({
        shrink: {
          target: 1
        , threshold: 2
        }
      })
      await deduplicator.add([1])

      const result = await deduplicator.addAndDiffLast(2)

      expect(result).toBe(true)
      expect(await deduplicator.addAndDiff([1, 2])).toStrictEqual([1])
    })
  })
})
