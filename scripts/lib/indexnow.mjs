/* ===========================================================
   IndexNow - instant URL submission to Bing, Yandex, Seznam
   (and via them DuckDuckGo, ChatGPT/Copilot search, etc.).
   The key is public by design and hosted at /<key>.txt.
   =========================================================== */

export const INDEXNOW_KEY = '0cee8bd66fa62b9a7f16ad0da8d5d250';
const HOST = 'offertje.nl';

/** Submit a list of full URLs to IndexNow. Returns {ok, status}. */
export async function indexNowSubmit(urls) {
    const list = (urls || []).filter(Boolean).slice(0, 10000);
    if (!list.length) return { ok: false, reason: 'geen urls' };
    try {
        const res = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host: HOST,
                key: INDEXNOW_KEY,
                keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
                urlList: list,
            }),
        });
        return { ok: res.ok, status: res.status, count: list.length };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}
