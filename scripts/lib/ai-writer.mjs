/* ===========================================================
   Offertje auto-blog - AI writer (Groq).
   Generates one complete blog-post object from a topic, in the
   exact schema used by scripts/build-blog.mjs.
   Model defaults to the same one app.agensea uses.
   =========================================================== */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export const CATEGORIES = ['Basis', 'Voorbeelden', 'ZZP & freelance', 'Juridisch & BTW', 'Verkoop & opvolging', 'Branche'];

const SYSTEM_PROMPT = `Je bent een Nederlandse SEO-copywriter voor "Offertje" (offertje.nl), een online offerte-generator (betaalde tool op /app, 0,50 euro per gedownloade PDF). Je schrijft een compleet, accuraat en behulpzaam blogartikel dat in Google.nl rankt en de lezer naar de tool stuurt.

Je antwoordt UITSLUITEND met een geldig JSON-object met exact deze velden:
- "title": H1 van de pagina (pakkend, bevat het keyword)
- "metaTitle": <title>, maximaal 60 tekens, eindigt op " | Offertje", bevat het keyword
- "metaDescription": 150-160 tekens, bevat het keyword, uitnodigend
- "excerpt": 1 tot 2 zinnen samenvatting, zonder opmaak
- "readingTime": geheel getal (minuten)
- "bodyHtml": de HTML-body van het artikel (zie regels)
- "faq": array van 3 tot 5 objecten {"q": "...", "a": "..."} (a mag <a href>-links bevatten)
- "related": array van exact 3 slugs uit de meegegeven lijst met bestaande slugs

Regels voor bodyHtml (gewone HTML-string, GEEN markdown, GEEN <h1>):
- Begin met een sterke intro-<p>.
- Secties met <h2 id="kebab-id">Titel</h2> (meerdere), subkopjes <h3>.
- Toegestaan: <p>, <ul>/<ol>/<li>, <table><thead><tbody><tr><th><td>, <blockquote>, <strong>.
- Voor een branche-artikel: voeg een realistische voorbeeld-offertetabel toe (omschrijving, aantal/eenheid, prijs, BTW, totaal) plus een totaaloverzicht met BTW uitgesplitst. Bedragen illustratief, reken ze correct.
- Optioneel bovenaan: <div class="key-takeaways"><strong>In het kort</strong><ul><li>...</li></ul></div>
- Tip-box: <div class="callout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><p>Tekst.</p></div>
- Plaats exact 1 keer de letterlijke tekst {{CTA}} ongeveer halverwege (wordt later een CTA-blok naar /app).
- Interne links: 4 tot 8 keer, naar de tool <a href="/app">...</a> en naar bestaande artikelen <a href="/blog/SLUG/">...</a> waarbij SLUG uit de meegegeven lijst komt.
- Euro's in Nederlandse notatie, bijvoorbeeld &euro; 1.250,00. BTW als 21%, 9% of 0%.
- Lengte 1100 tot 1600 woorden. Accuraat voor Nederland; verzin geen wetsartikelen. Fiscale claims algemeen houden.

Stijl: Nederlands, professioneel maar toegankelijk, actieve stem, je-vorm. GEEN emoji. GEEN em-dash (gebruik komma, punt of koppelteken). GEEN cursief/<em> (gebruik <strong>). Merknaam in tekst is Offertje.`;

function userPrompt(topic, slugList) {
    return `Schrijf het artikel voor dit onderwerp.

Keyword: ${topic.keyword}
Categorie: ${topic.category}
Invalshoek: ${topic.angle || 'Praktische, complete gids rond dit keyword.'}
Voorkeur voor "related": ${(topic.related || []).join(', ') || 'kies zelf 3 relevante'}

Bestaande slugs die je in interne links en in "related" mag gebruiken:
${slugList.join(', ')}

Antwoord met het JSON-object, niets anders.`;
}

/** Strip code fences and parse the model's JSON content. */
function parseJson(content) {
    let s = content.trim();
    if (s.startsWith('```')) s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start > 0 || end < s.length - 1) s = s.slice(start, end + 1);
    return JSON.parse(s);
}

/** Validate + normalise a post object. Throws on unrecoverable problems. */
export function validatePost(obj, topic, slugSet) {
    const out = { ...obj };
    out.slug = topic.slug;
    out.keyword = topic.keyword;
    out.category = CATEGORIES.includes(obj.category) ? obj.category : topic.category;

    for (const f of ['title', 'metaTitle', 'metaDescription', 'excerpt', 'bodyHtml']) {
        if (!out[f] || typeof out[f] !== 'string' || !out[f].trim()) throw new Error(`Veld ontbreekt of leeg: ${f}`);
    }

    // metaTitle: enforce suffix + length
    let mt = out.metaTitle.replace(/\s*\|\s*Offertje\s*$/i, '').trim();
    const SUFFIX = ' | Offertje';
    if (mt.length > 60 - SUFFIX.length) mt = mt.slice(0, 60 - SUFFIX.length).trim();
    out.metaTitle = mt + SUFFIX;

    // bodyHtml sanity
    if (!/\{\{CTA/.test(out.bodyHtml)) out.bodyHtml += '\n{{CTA}}';
    if (/<h1[\s>]/i.test(out.bodyHtml)) out.bodyHtml = out.bodyHtml.replace(/<\/?h1[^>]*>/gi, '');
    out.bodyHtml = out.bodyHtml.replace(/—/g, '-'); // strip em-dash defensively

    // faq
    out.faq = Array.isArray(obj.faq) ? obj.faq.filter((f) => f && f.q && f.a).slice(0, 5) : [];

    // related: keep only existing slugs, fall back to topic.related, then to staples
    const staples = ['offerte-maken', 'offerte-voorbeeld', 'wat-moet-er-op-een-offerte-staan'];
    const wanted = [...(Array.isArray(obj.related) ? obj.related : []), ...(topic.related || []), ...staples];
    out.related = [...new Set(wanted)].filter((s) => slugSet.has(s) && s !== topic.slug).slice(0, 3);

    out.readingTime = Number.isFinite(obj.readingTime) ? obj.readingTime : Math.max(4, Math.round(out.bodyHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).length / 200));
    return out;
}

/** A deterministic stub post so the pipeline can be tested without an API key. */
export function stubPost(topic, slugSet) {
    const related = [...(topic.related || []), 'offerte-maken', 'offerte-voorbeeld'].filter((s) => slugSet.has(s)).slice(0, 3);
    const body = `<p>Dit is een testartikel (dry run) over ${topic.keyword}. Het bevat geen echte AI-tekst, maar laat zien dat de pijplijn werkt.</p>
<h2 id="inleiding">Inleiding over ${topic.keyword}</h2>
<p>Lees ook de gids <a href="/blog/offerte-maken/">offerte maken</a> of begin direct in <a href="/app">de tool</a>.</p>
{{CTA}}
<h2 id="afronding">Afronding</h2>
<p>Klaar om te beginnen? <a href="/app">Maak je offerte met Offertje</a>.</p>`;
    return validatePost({
        title: `${topic.keyword} (testartikel)`,
        metaTitle: `${topic.keyword}`,
        metaDescription: `Testbeschrijving voor ${topic.keyword}. Dit is een dry-run artikel om de Offertje blogmotor te testen, nog zonder echte inhoud erin.`,
        excerpt: `Dry-run testartikel over ${topic.keyword}.`,
        readingTime: 4,
        bodyHtml: body,
        faq: [{ q: `Wat is ${topic.keyword}?`, a: 'Dit is een testantwoord.' }],
        related,
    }, topic, slugSet);
}

/**
 * Generate a full post object for a topic.
 * opts: { apiKey, model, slugList (array of existing slugs), dryRun }
 */
export async function generatePostObject(topic, opts = {}) {
    const slugList = opts.slugList || [];
    const slugSet = new Set(slugList);

    if (opts.dryRun || !opts.apiKey) {
        return stubPost(topic, slugSet);
    }

    // Model resolution: explicit --model > GROQ_MODEL env > sensible default.
    const model = opts.model || process.env.GROQ_MODEL || DEFAULT_MODEL;

    const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
            model,
            temperature: 0.6,
            max_tokens: 6000,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt(topic, slugList) },
            ],
        }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Groq API ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq gaf geen content terug.');

    const parsed = parseJson(content);
    return validatePost(parsed, topic, slugSet);
}
