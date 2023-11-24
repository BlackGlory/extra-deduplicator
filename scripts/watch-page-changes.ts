// @name Watch page changes
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts'
import { assert } from 'https://deno.land/std@0.207.0/assert/mod.ts'
import { script, NotificationFilter } from '@src/script.ts'

const parser = new DOMParser()

export default script(
  async (_, { name, url, selector }: {
    name: string
    url: string
    selector: string
  }) => {
    const html = await fetch(url).then(res => res.text())

    const document = parser.parseFromString(html, 'text/html')
    assert(document)

    const element = document.querySelector(selector)
    assert(element)

    return {
      id: element.outerHTML
    , title: `${name} Changed`
    , url
    }
  }
, { filter: NotificationFilter.KeepLatestDiff }
)
