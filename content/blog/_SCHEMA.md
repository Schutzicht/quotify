# Offertje blogpost schema

Elke post is een bestand `content/blog/<slug>.mjs` met `export default { ... }`.

## Velden

| veld | type | uitleg |
|---|---|---|
| `slug` | string | kebab-case, = mapnaam en URL `/blog/<slug>/` |
| `title` | string | H1 op de pagina (mag jaartal/term bevatten) |
| `metaTitle` | string | `<title>`, ~55-60 tekens, bevat keyword + " | Offertje" |
| `metaDescription` | string | ~150-160 tekens, wervend, met keyword |
| `category` | string | exact 1 van: `Basis`, `Voorbeelden`, `ZZP & freelance`, `Juridisch & BTW`, `Verkoop & opvolging`, `Branche` |
| `keyword` | string | primaire zoekterm |
| `date` | string | `YYYY-MM-DD` publicatie |
| `updated` | string | `YYYY-MM-DD` bijgewerkt |
| `featured` | boolean | optioneel, alleen de pillar = true |
| `excerpt` | string | 1-2 zinnen samenvatting (kaarten + lead) |
| `bodyHtml` | string (template literal) | het artikel, zie regels |
| `faq` | array van `{q, a}` | 3-5 vragen; `a` mag HTML/links bevatten |
| `related` | array van slugs | 3 gerelateerde posts |

## Regels voor bodyHtml

- GEEN `<h1>` (die komt uit `title`). Begin met een sterke intro-`<p>`.
- Secties met `<h2 id="kebab-id">Titel</h2>` (de id voedt de inhoudsopgave).
- Subsecties met `<h3>`.
- Gebruik `<p>`, `<ul><li>`, `<ol><li>`, `<table>`, `<blockquote>`.
- Callout: `<div class="callout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><p>Tip-tekst.</p></div>`
- Optioneel bovenaan een samenvatting: `<div class="key-takeaways"><strong>In het kort</strong><ul><li>...</li></ul></div>`
- Plaats exact 1 keer `{{CTA}}` ongeveer halverwege (wordt een CTA-blok naar /app). Variant met eigen tekst: `{{CTA:Eigen kop|Eigen tekst}}`.
- Interne links: naar andere posts `<a href="/blog/<slug>/">...</a>`, naar de tool `<a href="/app">...</a>`. Link royaal en relevant.
- Lengte: 1200-2200 woorden, diepgaand en praktisch (E-E-A-T).

## Stijl (hard, niet onderhandelbaar)

- Nederlands, professioneel maar toegankelijk, actieve stem.
- GEEN emoji's.
- GEEN em-dash (—). Gebruik komma, punt of koppelteken.
- GEEN cursief / `<em>`. Accent via `<strong>` of kleur.
- Schrijf voor de ondernemer die snel een offerte wil maken en converteer naar de tool.
