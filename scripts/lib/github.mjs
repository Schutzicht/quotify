/* ===========================================================
   Offertje auto-blog - GitHub helper.
   Creates a branch, commits a new post file and opens a PR,
   so an AI-written draft lands as a reviewable pull request
   instead of being published unattended.
   Uses the GitHub REST API via global fetch (Node 18+).
   =========================================================== */

const API = 'https://api.github.com';

function headers(token) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'offertje-blog-bot',
    };
}

async function gh(token, method, path, body) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: headers(token),
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`GitHub ${method} ${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
    return data;
}

/** Does content/blog/<slug>.mjs already exist on the default branch? */
export async function blogSlugsOnGithub(token, owner, repo) {
    try {
        const list = await gh(token, 'GET', `/repos/${owner}/${repo}/contents/content/blog`);
        return new Set(
            (Array.isArray(list) ? list : [])
                .filter((f) => f.name && f.name.endsWith('.mjs') && !f.name.startsWith('_'))
                .map((f) => f.name.replace(/\.mjs$/, ''))
        );
    } catch {
        return new Set();
    }
}

/**
 * Commit the new post file straight to the branch (default main).
 * No PR, no review step: the commit triggers a Vercel build and the
 * article goes live automatically. params: { token, owner, repo,
 * branch='main', slug, fileContent }. Returns the commit html_url.
 */
export async function commitPostDirect({ token, owner, repo, branch = 'main', slug, fileContent }) {
    const path = `content/blog/${slug}.mjs`;
    let existingSha;
    try {
        const cur = await gh(token, 'GET', `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
        existingSha = cur.sha;
    } catch { /* new file */ }

    const out = await gh(token, 'PUT', `/repos/${owner}/${repo}/contents/${path}`, {
        message: `content: auto-blog ${slug}`,
        content: Buffer.from(fileContent, 'utf8').toString('base64'),
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
    });
    return out.commit?.html_url || `commit ${slug}`;
}

/**
 * Create a branch with the new post file and open a PR.
 * params: { token, owner, repo, base='main', slug, fileContent, title }
 * returns the PR html_url.
 */
export async function createPostPR({ token, owner, repo, base = 'main', slug, fileContent, title }) {
    const branch = `auto-blog/${slug}`;
    const path = `content/blog/${slug}.mjs`;

    // 1. base sha
    const ref = await gh(token, 'GET', `/repos/${owner}/${repo}/git/ref/heads/${base}`);
    const baseSha = ref.object.sha;

    // 2. create branch (ignore "already exists")
    try {
        await gh(token, 'POST', `/repos/${owner}/${repo}/git/refs`, { ref: `refs/heads/${branch}`, sha: baseSha });
    } catch (e) {
        if (!/already exists/i.test(String(e.message))) throw e;
    }

    // 3. put file on branch (handle existing file -> need its sha)
    let existingSha;
    try {
        const cur = await gh(token, 'GET', `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
        existingSha = cur.sha;
    } catch { /* file does not exist yet */ }

    await gh(token, 'PUT', `/repos/${owner}/${repo}/contents/${path}`, {
        message: `content: auto-blog ${slug}`,
        content: Buffer.from(fileContent, 'utf8').toString('base64'),
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
    });

    // 4. open PR (reuse if one is already open)
    try {
        const pr = await gh(token, 'POST', `/repos/${owner}/${repo}/pulls`, {
            title: title || `Nieuw blogartikel: ${slug}`,
            head: branch,
            base,
            body: `Automatisch gegenereerd concept voor /blog/${slug}/.\n\nControleer de tekst en merge om te publiceren. Bij merge bouwt Vercel de site opnieuw en gaat het artikel live.`,
        });
        return pr.html_url;
    } catch (e) {
        if (/A pull request already exists/i.test(String(e.message))) {
            const open = await gh(token, 'GET', `/repos/${owner}/${repo}/pulls?head=${owner}:${branch}&state=open`);
            return open[0]?.html_url || `branch ${branch} bijgewerkt`;
        }
        throw e;
    }
}
