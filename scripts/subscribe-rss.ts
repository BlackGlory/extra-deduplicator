// @name Subscribe to RSS Feed
import { parseFeed } from 'https://deno.land/x/rss@1.0.0/mod.ts'
import { unescape } from 'https://deno.land/std@0.208.0/html/mod.ts'
import { firstNotNullishOf } from 'https://deno.land/std@0.208.0/collections/mod.ts'
import { script, Mode } from '@src/script.ts'

export default script(
  async (url: string) => {
    const xml = await fetch(url).then(res => res.text())

    const feed = await parseFeed(xml)

    return feed.entries.map(entry => ({
      id: entry.id
    , title: entry.title?.value
        ? unescape(entry.title?.value)
        : undefined
    , message: entry.content?.value
        ? unescape(entry.content.value)
        : undefined
    , url: firstNotNullishOf(entry.links, link => link.href)
    }))
  }
, { mode: Mode.KeepDiff }
)
