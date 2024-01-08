// @name Watch page changes
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts'
import { assert } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { go } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { script, Mode } from '@src/script.ts'

const parser = new DOMParser()

export default script(
  async ({ name, url, selector }: {
    name: string
    url: string
    selector?: string
  }) => {
    const html = await fetch(url).then(res => res.text())

    const id = go(() => {
      if (selector) {
        const document = parser.parseFromString(html, 'text/html')
        assert(document)

        const element = document.querySelector(selector)
        assert(element)

        return element.outerHTML
      } else {
        return html
      }
    })

    return {
      id
    , title: `${name} changed`
    , url
    }
  }
, { mode: Mode.KeepLatestDiff }
)
