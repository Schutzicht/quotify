/* ===========================================================
   Offertje blog generator
   Reads content/blog/*.mjs and renders static, SEO-optimized
   HTML into public/blog/ + sitemap.xml + robots.txt.
   Run: node scripts/build-blog.mjs
   =========================================================== */

import { readdirSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'content', 'blog');
const OUT_DIR = join(ROOT, 'public', 'blog');

const SITE = {
    url: 'https://offertje.nl', // productiedomein (koop offertje.nl en koppel in Vercel)
    name: 'Offertje',
    tagline: 'Online offerte generator',
    appUrl: '/app',
};

/* ---------------- helpers ---------------- */

const esc = (s = '') =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripTags = (s = '') => String(s).replace(/<[^>]+>/g, '').trim();

const wordCount = (html) => stripTags(html).split(/\s+/).filter(Boolean).length;

const formatDate = (iso) => {
    const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    const d = new Date(iso + 'T00:00:00');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const tocFromBody = (html) => {
    const re = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
    const items = [];
    let m;
    while ((m = re.exec(html)) !== null) items.push({ id: m[1], label: stripTags(m[2]) });
    return items;
};

/* The inline CTA box that replaces {{CTA}} tokens in body */
const ctaBox = (heading, text) => `
<div class="cta-box">
  <div>
    <strong>${esc(heading)}</strong>
    <p>${esc(text)}</p>
  </div>
  <a class="cta-box-btn" href="${SITE.appUrl}">Offerte maken
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  </a>
</div>`;

const renderBody = (post) => {
    let html = post.bodyHtml;
    // Replace {{CTA}} tokens (optionally {{CTA:Heading|Text}})
    html = html.replace(/\{\{CTA(?::([^|]+)\|([^}]+))?\}\}/g, (_, h, t) =>
        ctaBox(h || 'Klaar om je offerte te maken?', t || 'Maak in 2 minuten een professionele offerte als PDF, in je eigen huisstijl. Gratis opstellen, geen account.')
    );
    return html;
};

/* ---------------- shared chrome ---------------- */

const brandSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6M9 17h4"/></svg>`;

const header = () => `
<header class="site-header" id="header">
  <div class="wrap nav">
    <a class="brand" href="/">
      <span class="brand-mark">${brandSvg}</span> ${SITE.name}
    </a>
    <nav class="nav-links">
      <a href="/#hoe">Hoe het werkt</a>
      <a href="/#functies">Functies</a>
      <a href="/blog/">Blog</a>
    </nav>
    <div class="nav-cta">
      <a href="${SITE.appUrl}" class="btn btn-primary">Offerte maken</a>
    </div>
  </div>
</header>`;

const footer = (posts) => {
    const links = posts.slice(0, 4).map((p) => `<a href="/blog/${p.slug}/">${esc(p.title)}</a>`).join('');
    return `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/"><span class="brand-mark">${brandSvg}</span> ${SITE.name}</a>
        <p>De snelste manier om een professionele offerte te maken. Online, in jouw huisstijl, direct als PDF.</p>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <a href="${SITE.appUrl}">Offerte maken</a>
        <a href="/#functies">Functies</a>
      </div>
      <div class="footer-col">
        <h4>Populaire gidsen</h4>
        ${links}
      </div>
      <div class="footer-col">
        <h4>Meer</h4>
        <a href="/blog/">Alle artikelen</a>
        <a href="/#branches">Voor wie</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 ${SITE.name}. Alle rechten voorbehouden.</span>
      <span>Gemaakt voor ondernemers in Nederland.</span>
    </div>
  </div>
</footer>`;
};

const headTags = ({ title, description, canonical, image, jsonld }) => `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#6366f1">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <link rel="stylesheet" href="/blog/assets/blog.css">
  <script defer src="/_vercel/insights/script.js"></script>
  ${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n  ')}`;

/* ---------------- post page ---------------- */

const renderPost = (post, all) => {
    const canonical = `${SITE.url}/blog/${post.slug}/`;
    const image = post.image ? `${SITE.url}${post.image}` : `${SITE.url}/og-image.png`;
    const toc = (post.toc && post.toc.length ? post.toc : tocFromBody(post.bodyHtml));
    const reading = post.readingTime || Math.max(3, Math.round(wordCount(post.bodyHtml) / 200));
    const related = (post.related || [])
        .map((slug) => all.find((p) => p.slug === slug))
        .filter(Boolean)
        .slice(0, 3);

    const jsonld = [
        {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.metaDescription,
            datePublished: post.date,
            dateModified: post.updated || post.date,
            author: { '@type': 'Organization', name: SITE.name },
            publisher: {
                '@type': 'Organization',
                name: SITE.name,
                logo: { '@type': 'ImageObject', url: `${SITE.url}/logo.svg` },
            },
            mainEntityOfPage: canonical,
            image,
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.url}/` },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE.url}/blog/` },
                { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
            ],
        },
    ];
    if (post.faq && post.faq.length) {
        jsonld.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: post.faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: stripTags(f.a) },
            })),
        });
    }

    const tocHtml = toc.length
        ? `<aside class="post-toc">
        <div class="toc-sticky">
          <span class="toc-title">In dit artikel</span>
          <nav>${toc.map((t) => `<a href="#${t.id}">${esc(t.label)}</a>`).join('')}</nav>
          <a class="toc-cta" href="${SITE.appUrl}">Direct offerte maken</a>
        </div>
      </aside>`
        : '';

    const faqHtml = post.faq && post.faq.length
        ? `<section class="post-faq">
        <h2 id="veelgestelde-vragen">Veelgestelde vragen</h2>
        ${post.faq.map((f) => `
        <div class="faq-item">
          <button class="faq-q">${esc(f.q)}</button>
          <div class="faq-a"><div class="faq-a-inner">${f.a}</div></div>
        </div>`).join('')}
      </section>`
        : '';

    const relatedHtml = related.length
        ? `<section class="related">
        <h2>Lees ook</h2>
        <div class="related-grid">
          ${related.map((p) => `
          <a class="related-card" href="/blog/${p.slug}/">
            <span class="post-tag">${esc(p.category)}</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.excerpt)}</p>
          </a>`).join('')}
        </div>
      </section>`
        : '';

    return `<!DOCTYPE html>
<html lang="nl">
<head>${headTags({ title: post.metaTitle, description: post.metaDescription, canonical, image, jsonld })}
</head>
<body>
${header()}
<main class="post-wrap">
  <div class="wrap">
    <nav class="breadcrumb" aria-label="Kruimelpad">
      <a href="/">Home</a><span>/</span><a href="/blog/">Blog</a><span>/</span><span>${esc(post.category)}</span>
    </nav>
    <div class="post-hero">
      <span class="post-tag">${esc(post.category)}</span>
      <h1>${esc(post.title)}</h1>
      <p class="post-lead">${esc(post.excerpt)}</p>
      <div class="post-meta">
        <span>Bijgewerkt op ${formatDate(post.updated || post.date)}</span>
        <span class="dot"></span>
        <span>${reading} min lezen</span>
      </div>
    </div>
    <div class="post-layout">
      ${tocHtml}
      <article class="post-content">
        ${renderBody(post)}
        ${ctaBox('Maak nu je eigen offerte', 'Zet de theorie meteen om in de praktijk. Met Offertje maak je in 2 minuten een professionele offerte als PDF, in jouw huisstijl.')}
        ${faqHtml}
        ${relatedHtml}
      </article>
    </div>
  </div>
</main>
${footer(all)}
<script src="/blog/assets/blog.js" defer></script>
</body>
</html>`;
};

/* ---------------- hub page ---------------- */

const renderHub = (posts) => {
    const canonical = `${SITE.url}/blog/`;
    const cats = [...new Set(posts.map((p) => p.category))];
    const byCat = (c) => posts.filter((p) => p.category === c);

    const featured = posts.find((p) => p.featured) || posts[0];
    const rest = posts.filter((p) => p !== featured);

    const jsonld = [
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Offertje Blog - alles over offertes maken',
            description: 'Gidsen, voorbeelden en tips om professionele offertes te maken en meer opdrachten binnen te halen.',
            url: canonical,
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.url}/` },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: canonical },
            ],
        },
    ];

    const card = (p) => `
    <a class="post-card" href="/blog/${p.slug}/">
      <div class="post-cover"></div>
      <div class="post-body">
        <span class="post-tag">${esc(p.category)}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt)}</p>
        <span class="post-more">Lees verder
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
      </div>
    </a>`;

    return `<!DOCTYPE html>
<html lang="nl">
<head>${headTags({
        title: 'Blog over offertes maken | Offertje kennisbank',
        description: 'Praktische gidsen, voorbeelden en tips over offertes maken, opvolgen en winnen. Leer hoe je met een professionele offerte meer opdrachten binnenhaalt.',
        canonical,
        image: `${SITE.url}/og-image.png`,
        jsonld,
    })}
</head>
<body>
${header()}
<main>
  <section class="hub-hero">
    <div class="wrap">
      <span class="eyebrow">Kennisbank</span>
      <h1>Alles over offertes maken</h1>
      <p>Praktische gidsen, voorbeelden en tips om professionele offertes te maken en meer opdrachten binnen te halen.</p>
    </div>
  </section>
  <section class="wrap">
    <a class="hub-featured" href="/blog/${featured.slug}/">
      <div class="hub-featured-cover"></div>
      <div class="hub-featured-body">
        <span class="post-tag">Uitgelicht &middot; ${esc(featured.category)}</span>
        <h2>${esc(featured.title)}</h2>
        <p>${esc(featured.excerpt)}</p>
        <span class="post-more">Lees de gids
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
      </div>
    </a>
  </section>
  ${cats.map((c) => `
  <section class="wrap hub-cat">
    <div class="hub-cat-head"><h2>${esc(c)}</h2></div>
    <div class="post-grid">
      ${byCat(c).filter((p) => p !== featured).map(card).join('')}
    </div>
  </section>`).join('')}
  <section class="wrap">
    <div class="cta-band">
      <h2>Begin met je eigen offerte</h2>
      <p>Zet wat je leest direct om in de praktijk. Gratis opstellen, geen account, geen gedoe.</p>
      <a href="${SITE.appUrl}" class="btn btn-primary btn-lg">Offerte maken met Offertje</a>
    </div>
  </section>
</main>
${footer(posts)}
<script src="/blog/assets/blog.js" defer></script>
</body>
</html>`;
};

/* ---------------- assets ---------------- */

const BLOG_CSS = `/* Offertje blog styles */
:root{--font-sans:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;--indigo:#6366f1;--indigo-600:#4f46e5;--indigo-700:#4338ca;--indigo-glow:rgba(99,102,241,.45);--ink:#0f172a;--ink-700:#1e293b;--slate-600:#475569;--slate-500:#64748b;--slate-400:#94a3b8;--line:#e2e8f0;--line-soft:#f1f5f9;--bg:#fff;--bg-soft:#f8fafc;--bg-indigo:#eef2ff;--radius:16px;--radius-lg:24px;--shadow-sm:0 1px 2px rgba(15,23,42,.06);--shadow-md:0 10px 30px -12px rgba(15,23,42,.18);--shadow-lg:0 30px 60px -20px rgba(15,23,42,.28);--shadow-glow:0 18px 40px -12px var(--indigo-glow);--maxw:1140px;--ease:cubic-bezier(.16,1,.3,1)}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
html{scroll-behavior:smooth;scroll-padding-top:96px}
body{font-family:var(--font-sans);color:var(--ink-700);background:var(--bg);line-height:1.7;overflow-x:hidden}
a{color:inherit;text-decoration:none}
.wrap{width:100%;max-width:var(--maxw);margin-inline:auto;padding-inline:24px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--indigo-600);background:var(--bg-indigo);border:1px solid #e0e7ff;padding:6px 14px;border-radius:999px}
h1,h2,h3,h4{color:var(--ink);letter-spacing:-.02em;line-height:1.2;font-weight:800}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;font-family:inherit;font-weight:700;font-size:1rem;padding:14px 26px;border-radius:12px;border:1px solid transparent;cursor:pointer;transition:transform .35s var(--ease),box-shadow .35s var(--ease);white-space:nowrap}
.btn svg{width:18px;height:18px}
.btn-primary{background:linear-gradient(135deg,var(--indigo),var(--indigo-700));color:#fff;box-shadow:var(--shadow-glow)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 24px 50px -14px var(--indigo-glow)}
.btn-lg{padding:17px 32px;font-size:1.05rem}
/* header */
.site-header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.85);backdrop-filter:saturate(180%) blur(14px);-webkit-backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;height:72px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.2rem;color:var(--ink)}
.brand-mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--indigo),var(--indigo-700));display:grid;place-items:center;color:#fff;box-shadow:var(--shadow-glow)}
.brand-mark svg{width:19px;height:19px}
.nav-links{display:flex;align-items:center;gap:28px}
.nav-links a{font-size:.95rem;font-weight:600;color:var(--slate-600)}
.nav-links a:hover{color:var(--ink)}
/* breadcrumb */
.post-wrap{padding-bottom:40px}
.breadcrumb{display:flex;align-items:center;gap:10px;font-size:.85rem;color:var(--slate-500);padding:28px 0 0}
.breadcrumb a:hover{color:var(--indigo-600)}
.breadcrumb span{color:var(--slate-400)}
/* hero */
.post-hero{max-width:760px;padding:24px 0 36px;border-bottom:1px solid var(--line);margin-bottom:40px}
.post-tag{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--indigo-600)}
.post-hero h1{font-size:clamp(2rem,4.6vw,3rem);margin:14px 0 18px;line-height:1.12}
.post-lead{font-size:1.2rem;color:var(--slate-600)}
.post-meta{display:flex;align-items:center;gap:12px;margin-top:22px;color:var(--slate-500);font-size:.9rem;font-weight:600}
.post-meta .dot{width:4px;height:4px;border-radius:50%;background:var(--slate-400)}
/* layout */
.post-layout{display:grid;grid-template-columns:240px 1fr;gap:56px;align-items:start}
.post-toc .toc-sticky{position:sticky;top:96px}
.toc-title{display:block;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--slate-400);margin-bottom:14px}
.post-toc nav{display:flex;flex-direction:column;gap:2px;border-left:2px solid var(--line)}
.post-toc nav a{font-size:.9rem;color:var(--slate-600);padding:7px 0 7px 16px;margin-left:-2px;border-left:2px solid transparent;transition:color .2s,border-color .2s}
.post-toc nav a:hover{color:var(--indigo-600);border-left-color:var(--indigo)}
.toc-cta{display:inline-flex;align-items:center;gap:8px;margin-top:20px;font-weight:700;font-size:.9rem;color:var(--indigo-600)}
/* content */
.post-content{max-width:760px;font-size:1.07rem;color:var(--ink-700)}
.post-content h2{font-size:1.7rem;margin:44px 0 16px;scroll-margin-top:96px}
.post-content h3{font-size:1.3rem;margin:32px 0 12px}
.post-content p{margin-bottom:18px}
.post-content ul,.post-content ol{margin:0 0 20px 0;padding-left:24px}
.post-content li{margin-bottom:10px}
.post-content a{color:var(--indigo-600);font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
.post-content strong{color:var(--ink);font-weight:700}
.post-content blockquote{border-left:4px solid var(--indigo);background:var(--bg-soft);padding:18px 24px;border-radius:0 12px 12px 0;margin:0 0 22px;color:var(--ink-700);font-weight:500}
.post-content table{width:100%;border-collapse:collapse;margin:0 0 24px;font-size:.97rem}
.post-content th{text-align:left;background:var(--bg-soft);padding:12px 14px;border-bottom:2px solid var(--line);font-size:.82rem;text-transform:uppercase;letter-spacing:.04em;color:var(--slate-600)}
.post-content td{padding:12px 14px;border-bottom:1px solid var(--line-soft);vertical-align:top}
.post-content tr:last-child td{border-bottom:none}
/* callout & takeaways */
.callout{display:flex;gap:14px;background:var(--bg-indigo);border:1px solid #e0e7ff;border-radius:14px;padding:18px 20px;margin:0 0 24px}
.callout svg{width:22px;height:22px;color:var(--indigo-600);flex-shrink:0;margin-top:2px}
.callout p{margin:0;font-size:1rem}
.key-takeaways{background:var(--bg-soft);border:1px solid var(--line);border-radius:16px;padding:24px 26px;margin:0 0 32px}
.key-takeaways strong{display:block;font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:var(--indigo-600);margin-bottom:12px}
.key-takeaways ul{margin:0;padding-left:20px}
/* cta box */
.cta-box{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;background:linear-gradient(135deg,#eef2ff,#f8fafc);border:1px solid #e0e7ff;border-radius:18px;padding:26px 28px;margin:32px 0}
.cta-box strong{display:block;font-size:1.2rem;color:var(--ink);margin-bottom:6px}
.cta-box p{margin:0;color:var(--slate-600);font-size:.98rem;max-width:460px}
.cta-box-btn{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,var(--indigo),var(--indigo-700));color:#fff;font-weight:700;padding:14px 24px;border-radius:12px;box-shadow:var(--shadow-glow);white-space:nowrap;transition:transform .3s var(--ease)}
.cta-box-btn:hover{transform:translateY(-2px)}
.cta-box-btn svg{width:18px;height:18px}
/* faq */
.post-faq{max-width:760px;margin-top:48px}
.post-faq h2{font-size:1.7rem;margin-bottom:18px}
.faq-item{border-bottom:1px solid var(--line)}
.faq-q{width:100%;background:none;border:none;text-align:left;font-family:inherit;font-size:1.08rem;font-weight:700;color:var(--ink);padding:20px 40px 20px 0;cursor:pointer;position:relative;display:flex;justify-content:space-between;gap:16px}
.faq-q::after{content:"+";position:absolute;right:4px;font-size:1.5rem;font-weight:400;color:var(--indigo);transition:transform .3s var(--ease)}
.faq-item.open .faq-q::after{transform:rotate(45deg)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .4s var(--ease)}
.faq-a-inner{padding:0 0 20px;color:var(--slate-600)}
.faq-a-inner a{color:var(--indigo-600);font-weight:600}
/* related */
.related{max-width:1140px;margin-top:56px}
.related h2{font-size:1.5rem;margin-bottom:20px}
.related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.related-card{display:block;background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;transition:transform .4s var(--ease),box-shadow .4s var(--ease)}
.related-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-md)}
.related-card h3{font-size:1.05rem;margin:10px 0 8px;line-height:1.3}
.related-card p{color:var(--slate-600);font-size:.92rem}
/* hub */
.hub-hero{padding:56px 0 40px;background:radial-gradient(600px 280px at 80% 0%,rgba(99,102,241,.12),transparent 70%)}
.hub-hero h1{font-size:clamp(2.2rem,5vw,3.3rem);margin:16px 0 14px}
.hub-hero p{font-size:1.15rem;color:var(--slate-600);max-width:620px}
.hub-featured{display:grid;grid-template-columns:1fr 1.2fr;gap:0;background:#fff;border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:56px;box-shadow:var(--shadow-sm);transition:transform .4s var(--ease),box-shadow .4s var(--ease)}
.hub-featured:hover{transform:translateY(-4px);box-shadow:var(--shadow-md)}
.hub-featured-cover{background:linear-gradient(135deg,var(--indigo),var(--indigo-700));min-height:240px}
.hub-featured-body{padding:clamp(28px,4vw,44px)}
.hub-featured-body h2{font-size:clamp(1.5rem,3vw,2.1rem);margin:14px 0 14px}
.hub-featured-body p{color:var(--slate-600);font-size:1.05rem;margin-bottom:18px}
.hub-cat{margin-bottom:48px}
.hub-cat-head{display:flex;align-items:center;gap:16px;margin-bottom:24px}
.hub-cat-head h2{font-size:1.5rem}
.hub-cat-head::after{content:"";flex:1;height:1px;background:var(--line)}
.post-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.post-card{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;transition:transform .4s var(--ease),box-shadow .4s var(--ease)}
.post-card:hover{transform:translateY(-5px);box-shadow:var(--shadow-md)}
.post-cover{height:8px;background:linear-gradient(90deg,var(--indigo),var(--indigo-700))}
.post-card .post-body{padding:24px;display:flex;flex-direction:column;flex:1}
.post-card h3{font-size:1.12rem;margin:10px 0 8px;line-height:1.3}
.post-card p{color:var(--slate-600);font-size:.93rem;flex:1}
.post-more{margin-top:16px;font-weight:700;color:var(--indigo-600);font-size:.92rem;display:inline-flex;align-items:center;gap:6px}
/* cta band */
.cta-band{position:relative;border-radius:var(--radius-lg);overflow:hidden;background:linear-gradient(135deg,var(--indigo-700),var(--indigo));color:#fff;text-align:center;padding:clamp(48px,7vw,76px) 24px;margin:24px 0 64px}
.cta-band h2{color:#fff;font-size:clamp(1.8rem,4vw,2.5rem);margin-bottom:12px}
.cta-band p{color:rgba(255,255,255,.85);font-size:1.08rem;max-width:520px;margin:0 auto 28px}
.cta-band .btn-primary{background:#fff;color:var(--indigo-700);box-shadow:0 18px 40px -12px rgba(0,0,0,.4)}
/* footer */
.site-footer{background:var(--ink);color:#cbd5e1;padding:64px 0 32px;margin-top:40px}
.footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px;padding-bottom:40px;border-bottom:1px solid rgba(255,255,255,.08)}
.footer-brand .brand{color:#fff;margin-bottom:14px}
.footer-brand p{color:var(--slate-400);font-size:.95rem;max-width:320px}
.footer-col h4{color:#fff;font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
.footer-col a{display:block;color:var(--slate-400);font-size:.93rem;padding:6px 0;transition:color .2s}
.footer-col a:hover{color:#fff}
.footer-bottom{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding-top:28px;color:var(--slate-500);font-size:.88rem}
/* responsive */
@media(max-width:960px){.post-layout{grid-template-columns:1fr}.post-toc{display:none}.related-grid{grid-template-columns:1fr}.hub-featured{grid-template-columns:1fr}.post-grid{grid-template-columns:1fr 1fr}.footer-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.nav-links{display:none}.post-grid{grid-template-columns:1fr}.cta-box{flex-direction:column;align-items:flex-start}.footer-grid{grid-template-columns:1fr;gap:28px}.post-content{font-size:1.02rem}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;

const BLOG_JS = `document.querySelectorAll('.faq-item').forEach(function(item){var q=item.querySelector('.faq-q'),a=item.querySelector('.faq-a');if(!q||!a)return;q.addEventListener('click',function(){var open=item.classList.contains('open');item.classList.toggle('open',!open);a.style.maxHeight=open?null:a.scrollHeight+'px';});});`;

/* ---------------- sitemap & robots ---------------- */

const buildSitemap = (posts) => {
    const urls = [
        { loc: `${SITE.url}/`, priority: '1.0', changefreq: 'weekly' },
        { loc: `${SITE.url}/app`, priority: '0.9', changefreq: 'monthly' },
        { loc: `${SITE.url}/blog/`, priority: '0.8', changefreq: 'weekly' },
        ...posts.map((p) => ({
            loc: `${SITE.url}/blog/${p.slug}/`,
            priority: '0.7',
            changefreq: 'monthly',
            lastmod: p.updated || p.date,
        })),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
        .map(
            (u) =>
                `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
        )
        .join('\n')}
</urlset>
`;
};

const ROBOTS = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${SITE.url}/sitemap.xml
`;

/* ---------------- run ---------------- */

const run = async () => {
    if (!existsSync(CONTENT_DIR)) {
        console.error('No content/blog directory found.');
        process.exit(1);
    }
    const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));
    const posts = [];
    for (const f of files) {
        const mod = await import(pathToFileURL(join(CONTENT_DIR, f)).href);
        if (mod.default && mod.default.slug) posts.push(mod.default);
    }
    // newest first
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // clean generated post dirs (keep assets)
    if (existsSync(OUT_DIR)) {
        for (const entry of readdirSync(OUT_DIR)) {
            if (entry === 'assets') continue;
            rmSync(join(OUT_DIR, entry), { recursive: true, force: true });
        }
    }
    mkdirSync(join(OUT_DIR, 'assets'), { recursive: true });

    // assets
    writeFileSync(join(OUT_DIR, 'assets', 'blog.css'), BLOG_CSS);
    writeFileSync(join(OUT_DIR, 'assets', 'blog.js'), BLOG_JS);

    // posts
    for (const post of posts) {
        const dir = join(OUT_DIR, post.slug);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'index.html'), renderPost(post, posts));
    }

    // hub
    writeFileSync(join(OUT_DIR, 'index.html'), renderHub(posts));

    // machine-readable index (used by the admin dashboard "all blogs" list)
    writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(posts.map((p) => ({
        slug: p.slug, title: p.title, category: p.category,
        date: p.date, updated: p.updated || p.date, excerpt: p.excerpt, url: `/blog/${p.slug}/`,
    }))));

    // sitemap + robots
    writeFileSync(join(ROOT, 'public', 'sitemap.xml'), buildSitemap(posts));
    writeFileSync(join(ROOT, 'public', 'robots.txt'), ROBOTS);

    console.log(`Generated ${posts.length} posts + hub + sitemap.`);
    posts.forEach((p) => console.log(`  /blog/${p.slug}/  (${p.category})`));
};

run();
