# Remote Board

## Real-time problem it solves

Remote job hunting means checking one more board every day. Remote Board
pulls the live RemoteOK feed onto one page with a keyword search across
titles, companies and tags — and when the live feed cannot be reached, it
falls back to a dated snapshot instead of showing nothing or pretending old
listings are live.

## Data source

- Live: RemoteOK public API — `https://remoteok.com/api` (no key). The
  first element of the response is a legal notice, not a job; the app skips
  entries without a position and company.
- Snapshot: `jobs-snapshot.json` in this folder — 6 real listings captured
  from the live RemoteOK feed on 2026-10-29 (DuckDuckGo, Penumbra, Pavago,
  SupportYourApp, Sotheby's, Rain). The page always labels the list LIVE or
  SNAPSHOT, with the snapshot date, and warns that listings may have closed.
- Credit: listings link back to Remote OK as the source, per the API's
  terms.

## How to run

No build step and no dependencies. Serve the folder (the snapshot fallback
needs a web server — browsers block local file reads from pages opened
directly):

```sh
python3 -m http.server 8000
```

then open http://localhost:8000

Opening `index.html` directly still works for the live feed, but the
snapshot fallback will fail in that mode — the page says so instead of
showing invented jobs.

## Honest limits

- The live feed can fail from a browser because of CORS or network blocks;
  that is exactly what the snapshot fallback is for, and the page never
  presents snapshot listings as live.
- Snapshot listings are frozen at 2026-10-29. Always open the RemoteOK
  posting to check a role is still open before applying.
- Salaries shown as "not listed" mean the feed carried no salary range for
  that posting, not that the role is unpaid.
- Auto-refresh retries the live feed every 15 minutes.
