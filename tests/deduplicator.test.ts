import { describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.212.0/expect/mod.ts'
import { Deduplicator } from '@src/deduplicator.ts'

describe('Deduplicator', () => {
  it('create, close', async () => {
    const deduplicator = await Deduplicator.create()

    deduplicator.close()
  })

  it('add', async () => {
    const deduplicator = await Deduplicator.create<string>()

    try {
      await deduplicator.add([])
      await deduplicator.add(['foo', 'bar'])
    } finally {
      deduplicator.close()
    }
  })

  it('diff', async () => {
    const deduplicator = await Deduplicator.create<string>()

    const result1 = await deduplicator.diff([])
    const result2 = await deduplicator.diff(['foo'])
    const result3 = await deduplicator.diff(['foo', 'bar'])
    const result4 = await deduplicator.diff([])

    expect(result1).toStrictEqual([])
    expect(result2).toStrictEqual(['foo'])
    expect(result3).toStrictEqual(['bar'])
    expect(result4).toStrictEqual([])
  })

  it('lastDiff', async () => {
    const deduplicator = await Deduplicator.create<string>()

    const result1 = await deduplicator.lastDiff('foo')
    const result2 = await deduplicator.lastDiff('foo')
    const result3 = await deduplicator.lastDiff('bar')

    expect(result1).toBe(true)
    expect(result2).toBe(false)
    expect(result3).toBe(true)
  })
})
