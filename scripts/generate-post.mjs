/* ===========================================================
   Offertje auto-blog - local CLI.

   Generate the next queued post(s) with Groq and rebuild the blog.

   Usage:
     GROQ_API_KEY=... node scripts/generate-post.mjs            # next topic
     GROQ_API_KEY=... node scripts/generate-post.mjs --count=3  # next 3
     node scripts/generate-post.mjs --slug=offerte-airco        # specific topic
     node scripts/generate-post.mjs --dry                       # stub, no API key
     node scripts/generate-post.mjs --no-build                  # skip blog rebuild
   =========================================================== */

import { spawnSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadTopics, existingSlugs, writePostFile, CONTENT_DIR } from './lib/post-file.mjs';
import { generatePostObject } from './lib/ai-writer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const val = (name, def) => {
    const a = args.find((x) => x.startsWith(`--${name}=`));
    return a ? a.split('=')[1] : def;
};

const DRY = flag('dry');
const NO_BUILD = flag('no-build');
const COUNT = Math.max(1, parseInt(val('count', '1'), 10) || 1);
const ONLY_SLUG = val('slug', null);
const MODEL = val('model', undefined);
const apiKey = process.env.GROQ_API_KEY;

if (!DRY && !apiKey) {
    console.error('Geen GROQ_API_KEY gevonden. Zet hem in je omgeving, of gebruik --dry om de pijplijn te testen.');
    process.exit(1);
}

const run = async () => {
    const topics = await loadTopics();
    const taken = existingSlugs();
    const made = [];

    for (let i = 0; i < COUNT; i++) {
        let topic;
        if (ONLY_SLUG) {
            topic = topics.find((t) => t.slug === ONLY_SLUG);
            if (!topic) { console.error(`Onbekende slug in _topics.mjs: ${ONLY_SLUG}`); process.exit(1); }
            if (taken.has(topic.slug)) { console.error(`Bestaat al: ${topic.slug}`); process.exit(1); }
        } else {
            topic = topics.find((t) => t && t.slug && !taken.has(t.slug));
            if (!topic) { console.log('Geen onderwerpen meer in de wachtrij. Voeg er toe in content/blog/_topics.mjs.'); break; }
        }

        process.stdout.write(`Schrijven: ${topic.slug} (${topic.keyword}) ... `);
        const slugList = [...taken];
        const post = await generatePostObject(topic, { apiKey, model: MODEL, slugList, dryRun: DRY });
        post.date = post.date || new Date().toISOString().slice(0, 10);
        post.updated = new Date().toISOString().slice(0, 10);
        const path = writePostFile(post);
        taken.add(topic.slug);
        made.push(topic.slug);
        console.log('klaar.');

        // syntax sanity
        const check = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
        if (check.status !== 0) console.warn(`  Let op: node --check faalde voor ${path}\n${check.stderr}`);

        if (ONLY_SLUG) break;
    }

    if (!made.length) return;

    if (!NO_BUILD) {
        console.log('Blog opnieuw genereren ...');
        const build = spawnSync(process.execPath, [resolve(ROOT, 'scripts', 'build-blog.mjs')], { stdio: 'inherit' });
        if (build.status !== 0) console.warn('build-blog gaf een foutcode.');
    }

    console.log(`\nKlaar. ${made.length} artikel(en) aangemaakt: ${made.join(', ')}`);
    console.log('Controleer ze, commit en push (of laat Vercel bouwen).');
};

run().catch((e) => { console.error('Fout:', e.message); process.exit(1); });
