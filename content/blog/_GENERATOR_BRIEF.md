# Offertje blog - schrijfbrief voor SEO-artikelen

Je schrijft Nederlandse SEO-artikelen voor **Offertje** (offertje.nl), een online offerte-generator (betaalde tool op `/app`, 0,50 euro per gedownloade PDF). Doel: ranken in Google.nl en lezers naar de tool sturen.

## Output
Per post een bestand `content/blog/<slug>.mjs` met `export default { ... }`. Wijzig geen ander bestand.

## Objectvorm (alle velden verplicht)
```
{
  slug, title, metaTitle, metaDescription, category, keyword,
  date: 'YYYY-MM-DD' (tussen 2026-02-01 en 2026-05-30),
  updated: '2026-06-02',
  readingTime: <geheel getal>,
  excerpt: '1-2 zinnen, geen opmaak',
  bodyHtml: `...`,
  faq: [{q:'', a:''}, ...],   // 3 tot 5
  related: ['slug','slug','slug'],   // 3 bestaande slugs
}
```

## Categorie (exacte string)
`Basis` | `Voorbeelden` | `ZZP & freelance` | `Juridisch & BTW` | `Verkoop & opvolging` | `Branche`

## Canonieke slugs (gebruik ALLEEN deze voor interne links + related)
offerte-maken, offerte-voorbeeld, wat-moet-er-op-een-offerte-staan, verschil-offerte-en-factuur, offerte-maken-als-zzper, hoe-lang-is-een-offerte-geldig, btw-op-de-offerte, offerte-opvolgen, vrijblijvende-offerte-betekenis, offerte-template-word-of-generator, professionele-offerte-tips, begeleidende-email-bij-offerte, offerte-afwijzing-voorkomen, meerwerk-en-offerte, offerte-voorbeeld-bouw, offerte-schilder, offerte-hovenier, offerte-fotograaf, offerte-webdesign-freelance, offerte-schoonmaakbedrijf, offerte-loodgieter, offerte-elektricien, offerte-dakdekker, offerte-stukadoor, offerte-tegelzetter, offerte-vloerlegger, offerte-stratenmaker, offerte-zonnepanelen, offerte-warmtepomp, offerte-verbouwing, offerte-timmerman, offerte-verhuisbedrijf, offerte-catering, offerte-trainer-coach, offerte-tekstschrijver, offerte-marketingbureau, gratis-offerte-maken, offerte-software-vergelijken, offertes-vergelijken, offerte-accepteren, uurtarief-berekenen-zzp, aanbetaling-vragen, algemene-voorwaarden-offerte, offerte-ondertekenen

## bodyHtml regels
- Het is een JS template literal tussen backticks. CRUCIAAL: gebruik NOOIT een backtick (`) of de tekens `${` binnenin, en nooit de letterlijke tekst `</script>`. Gebruik rechte ASCII-quotes.
- Geen `<h1>` (titel rendert apart). Begin met een sterke intro-`<p>`.
- Kopjes `<h2 id="kebab-id">Titel</h2>` (meerdere), subkopjes `<h3>`.
- Toegestaan: `<p>`, `<ul>/<ol>/<li>`, `<table><thead><tbody><tr><th><td>`, `<blockquote>`, `<strong>`.
- Branche-posts: neem een realistische VOORBEELD-OFFERTETABEL op (omschrijving, aantal/eenheid, prijs, BTW, totaal) + een totaaloverzicht met BTW uitgesplitst. Bedragen zijn illustratief.
- Optioneel bovenaan: `<div class="key-takeaways"><strong>In het kort</strong><ul><li>...</li></ul></div>`
- Tip-box: `<div class="callout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><p>Tekst.</p></div>`
- Plaats exact 1 `{{CTA}}`-token ongeveer halverwege (variant `{{CTA:Kop|Tekst}}` mag).
- Interne links: 4 tot 8 keer naar relevante posts `<a href="/blog/<slug>/">...</a>` en naar de tool `<a href="/app">...</a>`.
- Euro's NL-notatie: `&euro; 1.250,00`. BTW als 21%, 9%, 0%.
- Lengte 1100 tot 1700 woorden. Accuraat voor Nederland; verzin geen wetsartikelen. Houd fiscale claims algemeen (BTW 21/9/0; voor renovatie/schilder/stukadoor aan woningen ouder dan 2 jaar kan 9% op arbeid gelden, laat lezer dit checken; op zonnepanelen voor woningen geldt 0% btw; KOR algemeen).

## Stijl (verplicht)
- Nederlands, professioneel maar toegankelijk, actieve stem, je-vorm.
- GEEN emoji's. GEEN em-dash (—); gebruik komma, punt of koppelteken. GEEN cursief / `<em>`; benadruk met `<strong>`.
- Merknaam in tekst is **Offertje** (niet Quotify).

## Meta
- metaTitle <= 60 tekens, eindigt op ` | Offertje`, bevat het keyword.
- metaDescription 150-160 tekens, bevat het keyword, uitnodigend.

## Na elk bestand
Voer uit `node --check <absoluut pad>` en herstel syntaxfouten. Bevestig dat alle bestanden slagen.
