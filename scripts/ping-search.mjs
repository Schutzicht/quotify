/* ===========================================================
   Ping search engines with all site URLs (from the sitemap):
   - IndexNow (Bing / Yandex / Seznam -> fast crawl)
   - WebSub hub (feed discovery)
   - Google Indexing API (only if GOOGLE_SA_KEY is set)

   Usage: node scripts/ping-search.mjs
   =========================================================== */

import { readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { indexNowSubmit } from './lib/indexnow.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://offertje.nl';

const xml = readFileSync(join(ROOT, 'public', 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const run = async () => {
    console.log(`Aanmelden van ${urls.length} URL's...`);

    const inx = await indexNowSubmit(urls);
    console.log('IndexNow (Bing/Yandex):', inx.ok ? `OK (${inx.status})` : `mislukt (${inx.status || inx.error || inx.reason})`);

    // WebSub: notify the hub that the feed changed (helps discovery)
    try {
        const r = await fetch('https://pubsubhubbub.appspot.com/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'hub.mode=publish&hub.url=' + encodeURIComponent(`${SITE}/blog/feed.xml`),
        });
        console.log('WebSub hub:', r.status);
    } catch (e) {
        console.log('WebSub hub: mislukt', e.message);
    }

    if (process.env.GOOGLE_SA_KEY) {
        const { googleIndexSubmit } = await import('./lib/google-index.mjs');
        const g = await googleIndexSubmit(urls);
        console.log('Google Indexing API:', JSON.stringify(g));
    } else {
        console.log('Google Indexing API: overgeslagen (zet GOOGLE_SA_KEY om dit aan te zetten).');
    }
};

run();
