import { start } from '@src/start.ts'
import halluStartup from '@scripts/hallu-startup.ts'
import subscribeRSS from '@scripts/subscribe-rss.ts'
import watchPageChanges from '@scripts/watch-page-changes.ts'

start(halluStartup(), {
  once: true
, ignoreInitialCommit: false
, ignoreStartupCommit: false
})

start(subscribeRSS('https://news.ycombinator.com/rss'))

start(watchPageChanges({
  name: 'IP Address'
, url: 'https://icanhazip.com/'
}))
