import { isURLString } from 'npm:extra-utils@^5.5.2'

export interface Metadata {
  name: string | null
  updateURLs: string[]
}

export function parseMetadata(code: string): Metadata {
  let name: string | null = null
  const updateURLs: string[] = []

  for (const { key, value } of parseMetadataLines(code)) {
    switch (key) {
      case 'name': {
        name = parseNameValue(value)
        break
      }
      case 'update-url': {
        const updateURL = parseUpdateURLValue(value)
        if (updateURL) updateURLs.push(updateURL)
        break
      }
    }
  }

  return {
    name
  , updateURLs
  }
}

function parseNameValue(value: string): string {
  return value
}

function parseUpdateURLValue(value: string): string | null {
  if (isURLString(value)) {
    return value
  } else {
    return null
  }
}

export function* parseMetadataLines(code: string): Iterable<{
  key: string
  value: string
}> {
  const re = /^\/\/ @(?<key>[\w-]+)[\s^\n]+(?<value>.*?)[\s^\n]*$/gm
  for (const { groups } of code.matchAll(re)) {
    const { key, value } = groups!
    yield { key, value }
  }
}
