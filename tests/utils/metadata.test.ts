import { it } from 'https://deno.land/std@0.208.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.208.0/expect/mod.ts'
import { dedent } from 'npm:extra-tags@^0.4.2'
import { toArray } from 'npm:@blackglory/prelude@^0.3.4'
import { parseMetadata, parseMetadataLines } from '@utils/metadata.ts'

it('parseMetadata', () => {
  const codes = dedent`
  // @name Hello World
  // @update-url http://example.com
  // @foo bar
  `

  const result = parseMetadata(codes)

  expect(result).toEqual({
    name: 'Hello World'
  , updateURLs: ['http://example.com']
  })
})

it('parseMetadataLines', () => {
  const codes = dedent`
    // @key1 value1

    // @key2 value2
  `

  const iter = parseMetadataLines(codes)
  const result = toArray(iter)

  expect(result).toEqual([
    { key: 'key1', value: 'value1' }
  , { key: 'key2', value: 'value2' }
  ])
})
