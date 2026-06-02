# Offertje auto-blogmotor

Een SEO-contentmotor die automatisch nieuwe blogartikelen schrijft over offerte-onderwerpen, in dezelfde stijl en hetzelfde schema als de bestaande blog. Doel: doorlopend nieuwe long-tail pagina's toevoegen die organisch verkeer naar de tool trekken.

Er zijn twee manieren om hem te gebruiken: **lokaal (CLI)** voor bulk en controle, en **automatisch (Vercel cron)** dat wekelijks een concept als pull request klaarzet.

## Hoe het werkt

1. **De wachtrij** staat in [`content/blog/_topics.mjs`](content/blog/_topics.mjs): een lijst onderwerpen (slug, keyword, categorie, invalshoek, related). Voeg hier gerust rijen toe; dat is je contentbacklog.
2. De motor pakt het **eerste onderwerp dat nog geen** `content/blog/<slug>.mjs` heeft.
3. **Groq** (model `llama-3.3-70b-versatile`) schrijft een compleet artikel als JSON, dat wordt gevalideerd en als `content/blog/<slug>.mjs` weggeschreven.
4. De bestaande generator (`scripts/build-blog.mjs`) maakt er bij de volgende build SEO-HTML + sitemap van.

## Lokaal gebruiken (aanrader voor kwaliteit)

```bash
# eenmalig: zet je Groq-key in de omgeving
export GROQ_API_KEY=gsk_...

# volgende onderwerp uit de wachtrij schrijven + blog herbouwen
npm run blog:new

# meerdere tegelijk
node scripts/generate-post.mjs --count=3

# een specifiek onderwerp
node scripts/generate-post.mjs --slug=offerte-airco

# alleen de pijplijn testen zonder API-key (maakt een stub)
node scripts/generate-post.mjs --dry
```

Daarna controleer je de nieuwe `content/blog/<slug>.mjs`, en `git add . && git commit && git push` (Vercel bouwt en publiceert).

## Automatisch (Vercel cron -> pull request)

Ingesteld in [`vercel.json`](vercel.json): elke maandag 09:00 UTC roept Vercel `/api/cron/generate-blog` aan. Die genereert het volgende onderwerp en zet het als **pull request** klaar in GitHub. Jij controleert de tekst en **merget om te publiceren** (bij merge bouwt Vercel opnieuw en gaat het artikel live). De review-stap voorkomt dat ongecontroleerde AI-content direct online komt, wat Google kan afstraffen.

### Benodigde environment variables (Vercel project settings)

| Variabele | Verplicht | Uitleg |
|---|---|---|
| `GROQ_API_KEY` | ja | Groq API-key (zelfde provider als app.agensea) |
| `GITHUB_TOKEN` | ja | GitHub Personal Access Token met `repo`-scope (Contents + Pull requests: read/write) |
| `GITHUB_OWNER` | nee | standaard `Schutzicht` |
| `GITHUB_REPO` | nee | standaard `quotify` |
| `GITHUB_BASE` | nee | standaard `main` |
| `CRON_SECRET` | aanbevolen | als gezet, accepteert het endpoint alleen Vercels cron-aanroep |

### Handmatig triggeren / testen

```bash
# als CRON_SECRET niet gezet is:
curl https://offertje.nl/api/cron/generate-blog
# met CRON_SECRET:
curl -H "Authorization: Bearer <CRON_SECRET>" https://offertje.nl/api/cron/generate-blog
```

Antwoord is JSON met de aangemaakte slug en de PR-URL.

## Onderwerpen toevoegen

Open `content/blog/_topics.mjs` en voeg rijen toe, bijvoorbeeld:

```js
{ slug: 'offerte-steigerbouw', keyword: 'offerte steiger huren', category: 'Branche',
  angle: 'Offerte voor steigerbouw: opbouw, huur per week, transport. Voorbeeldtabel.',
  related: ['offerte-maken', 'offerte-voorbeeld', 'offerte-dakdekker'] },
```

De motor pikt nieuwe rijen vanzelf op zodra de oudere af zijn.

## Kwaliteit en SEO

- Laat de cron in **PR-modus** staan (niet direct naar main) en lees elk concept even na. Google waardeert nuttige, accurate content; bulk-AI zonder controle kan juist schaden.
- Groq is snel en goedkoop, maar de tekst is iets minder sterk dan handwerk. Voor je belangrijkste keywords kun je beter zelf (of via een betere prompt/model) schrijven.
- Houd de wachtrij gevuld met echte zoekvraag-onderwerpen; dat is de "scanner" die bepaalt waar je groeit.
