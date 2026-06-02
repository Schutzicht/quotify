import { generatePDF } from './pdf-gen.js';
import { computeQuote, fmtEUR } from './calc.js';

/* --- STATE MANAGEMENT --- */
const state = {
    sender: {
        company: '', contact: '', address: '', zip: '', city: '',
        email: '', phone: '', website: '', kvk: '', vat: '', iban: ''
    },
    client: {
        company: '', contact: '', address: '', zip: '', city: '',
        email: '', phone: '', kvk: '', vat: '', reference: ''
    },
    meta: {
        number: '2026-001', date: '', validUntil: '', title: 'OFFERTE', project: ''
    },
    branding: { logo: null, primaryColor: '#0F172A' },
    items: [],
    settings: { showSignature: true },
    signatureImage: '',
    total: 0,
    notes: ''
};

/* --- DOM REFERENCES --- */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* --- INIT --- */
document.addEventListener('DOMContentLoaded', () => {
    loadState(); // Restore before anything else

    initListeners();
    initItems();
    initPreviewZoom();
    initModal();

    setCurrentDate();
    resetToDefaultItems();
    renderItemsUI(); // always render rows (also for state restored from localStorage)

    // Check if we just paid
    checkPaymentSuccess();

    initMobileTabs();

    const resetBtn = $('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetAll);

    document.querySelectorAll('.qs-btn').forEach((b) =>
        b.addEventListener('click', () => applyTemplate(b.dataset.tpl))
    );

    initTour();

    // Make the preview accent follow the chosen brand colour (matches the PDF)
    document.documentElement.style.setProperty('--accent', state.branding.primaryColor || '#6366F1');

    updatePreview();
});

function initMobileTabs() {
    const layout = document.querySelector('.gen3-layout');
    const btns = document.querySelectorAll('.mn-btn');

    // Default state for mobile
    if (window.innerWidth <= 768) {
        layout.classList.add('mobile-mode'); // New class to enforce mobile rules
        layout.classList.add('tab-config');
        layout.classList.remove('tab-preview');
    }

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            if (tab === 'config') {
                layout.classList.remove('tab-preview');
                layout.classList.add('tab-config');
            } else {
                layout.classList.remove('tab-config');
                layout.classList.add('tab-preview');
            }

            // Scroll to top when switching
            window.scrollTo(0, 0);
        });
    });
}

async function checkPaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
        // Clean the URL so a refresh does not re-trigger the success state.
        window.history.replaceState({}, document.title, window.location.pathname);
        // Show a success panel with a download button (a click guarantees the
        // browser allows the download, unlike an automatic save).
        setTimeout(showPaymentSuccess, 400);
    }
}

function initListeners() {
    ['sender', 'client', 'meta'].forEach(section => {
        const form = $(`${section}-form`);
        if (!form) return;
        form.addEventListener('input', (e) => {
            const field = e.target.name;
            if (state[section]) {
                state[section][field] = e.target.value;
                if (section === 'meta' && field === 'validUntil') state.meta._validUntilAuto = false;
                updatePreview();
            }
        });
    });

    const dateInput = $('meta-date');
    if (dateInput) dateInput.addEventListener('change', (e) => { state.meta.date = e.target.value; autoValidUntil(); updatePreview(); });

    const colorInput = $('accent-color');
    if (colorInput) {
        colorInput.addEventListener('input', (e) => {
            state.branding.primaryColor = e.target.value;
            document.documentElement.style.setProperty('--accent', state.branding.primaryColor);
            updatePreview();
        });
    }

    // Fix: Add Color Options Click Handlers
    $$('.c-opt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const color = e.target.dataset.color;
            if (color) {
                state.branding.primaryColor = color;
                document.documentElement.style.setProperty('--accent', color);

                // Visual update
                $$('.c-opt').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                if (colorInput) colorInput.value = color;

                updatePreview();
            }
        });
    });

    const logoInput = $('logo-upload');
    const dropzone = $('logo-dropzone');
    if (logoInput && dropzone) {
        dropzone.addEventListener('click', (e) => {
            if (state.branding.logo && e.target.closest('.remove-logo-btn')) {
                e.stopPropagation();
                // Remove Logic
                state.branding.logo = null;
                logoInput.value = ''; // clear input
                updateLogoUI(dropzone, null);
                updatePreview();
            } else {
                logoInput.click();
            }
        });

        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    let dataUrl = evt.target.result;
                    // SVG can't be embedded in the PDF directly, so rasterize to PNG.
                    if (file.type === 'image/svg+xml' || /^data:image\/svg/i.test(dataUrl)) {
                        dataUrl = await rasterizeSvg(dataUrl);
                    }
                    state.branding.logo = dataUrl;
                    updateLogoUI(dropzone, state.branding.logo);
                    updatePreview();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function updateLogoUI(dropzone, logo) {
        const icon = dropzone.querySelector('.icon');
        const text = dropzone.querySelector('span');

        if (logo) {
            // Show active state with remove option
            dropzone.style.borderColor = state.branding.primaryColor;
            dropzone.style.background = '#F0FDF4'; // Success green-ish
            if (icon) icon.innerHTML = '✓';
            if (text) text.innerHTML = `Logo ingesteld <br><span class="remove-logo-btn" style="color:#ef4444; font-size:0.8em; text-decoration:underline; cursor:pointer;">Verwijderen</span>`;
        } else {
            // Reset
            dropzone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            dropzone.style.background = 'rgba(0, 0, 0, 0.2)';
            if (icon) icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>'; // Restore upload icon or text
            if (text) text.textContent = 'Upload Logo';
        }
    }

    const notesInput = $('notes-input');
    if (notesInput) notesInput.addEventListener('input', (e) => { state.notes = e.target.value; updatePreview(); });
}

function setCurrentDate() {
    // Only default to today for a fresh quote; keep a restored/edited date.
    if (!state.meta.date) state.meta.date = formatNlDate(new Date());
    if ($('meta-date')) $('meta-date').value = state.meta.date;
    autoValidUntil();
}

/* --- ITEMS LOGIC --- */
function initItems() {
    $('add-item-btn').addEventListener('click', () => {
        state.items.push({
            id: Date.now(), description: '', price: 0, quantity: 1,
            unit: 'stk', vat: 21, discount: 0, period: 'one-off'
        });
        renderItemsUI();
        updatePreview();
    });
}

function resetToDefaultItems() {
    if (state.items.length === 0) {
        // Start with one empty row so the user has something to fill in (no demo data).
        state.items.push({
            id: 1, description: '', price: 0, quantity: 1,
            unit: 'stk', vat: 21, discount: 0, period: 'one-off'
        });
        renderItemsUI();
    }
}

function resetAll() {
    if (!confirm('Weet je zeker dat je opnieuw wilt beginnen? Alle ingevulde gegevens van deze offerte worden gewist.')) return;
    localStorage.removeItem('offertje_state');
    location.reload();
}

/* --- INPUT / DATE / IMAGE HELPERS --- */

// Accepts "1250", "1250,50", "1.250,50" and "1250.50"
function parseNum(v) {
    if (typeof v === 'number') return v;
    let s = String(v == null ? '' : v).trim().replace(/\s/g, '');
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

const pad2 = (n) => String(n).padStart(2, '0');
const formatNlDate = (d) => `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;

function parseNlDate(str) {
    const m = String(str || '').trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (!m) return null;
    let [, dd, mm, yy] = m;
    if (yy.length === 2) yy = '20' + yy;
    const d = new Date(Number(yy), Number(mm) - 1, Number(dd));
    return isNaN(d.getTime()) ? null : d;
}

// "Geldig tot" = datum + 30 dagen, tenzij de gebruiker zelf iets invulde.
function autoValidUntil(force = false) {
    if (state.meta.validUntil && state.meta._validUntilAuto === false && !force) return;
    const base = parseNlDate(state.meta.date) || new Date();
    const d = new Date(base);
    d.setDate(d.getDate() + 30);
    state.meta.validUntil = formatNlDate(d);
    state.meta._validUntilAuto = true;
    const inp = document.querySelector('#meta-form [name="validUntil"]');
    if (inp) inp.value = state.meta.validUntil;
}

// Rasterize an SVG data URL to PNG so jsPDF can embed it.
function rasterizeSvg(dataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth || img.width || 600;
            const h = img.naturalHeight || img.height || 200;
            const scale = Math.min(3, 600 / Math.max(1, w));
            const cw = Math.max(1, Math.round(w * scale));
            const ch = Math.max(1, Math.round(h * scale));
            const canvas = document.createElement('canvas');
            canvas.width = cw; canvas.height = ch;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, cw, ch);
            try { resolve(canvas.toDataURL('image/png')); } catch (e) { resolve(dataUrl); }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

const escapeHtml = (s) =>
    String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Quick-start example line items (the user edits them after loading). */
const TEMPLATES = {
    dienst: [
        { description: 'Voorbereiding en intake', quantity: 2, unit: 'uur', price: 75, vat: 21, discount: 0, period: 'one-off' },
        { description: 'Uitvoering werkzaamheden', quantity: 8, unit: 'uur', price: 75, vat: 21, discount: 0, period: 'one-off' },
        { description: 'Oplevering en nazorg', quantity: 1, unit: 'uur', price: 75, vat: 21, discount: 0, period: 'one-off' },
    ],
    project: [
        { description: 'Ontwerp en voorbereiding', quantity: 1, unit: '', price: 750, vat: 21, discount: 0, period: 'one-off' },
        { description: 'Realisatie', quantity: 1, unit: '', price: 1500, vat: 21, discount: 0, period: 'one-off' },
        { description: 'Oplevering en uitleg', quantity: 1, unit: '', price: 250, vat: 21, discount: 0, period: 'one-off' },
    ],
    abonnement: [
        { description: 'Eenmalige opstartkosten', quantity: 1, unit: '', price: 500, vat: 21, discount: 0, period: 'one-off' },
        { description: 'Onderhoud en support', quantity: 1, unit: 'maand', price: 50, vat: 21, discount: 0, period: 'monthly' },
    ],
};

function hasItemContent() {
    return state.items.some((i) => (i.description && i.description.trim()) || Number(i.price) > 0);
}

function applyTemplate(key) {
    const tpl = TEMPLATES[key];
    if (!tpl) return;
    if (hasItemContent() && !confirm('De huidige regels vervangen door dit voorbeeld?')) return;
    state.items = tpl.map((it, i) => ({ id: Date.now() + i, ...it }));
    renderItemsUI();
    updatePreview();
}

let savedTimer = null;
function flashSaved() {
    const el = $('autosave-hint');
    if (!el) return;
    el.classList.add('saved');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => el.classList.remove('saved'), 1200);
}

/* --- GUIDED TOUR (helpt nieuwe gebruikers: wat hoort waar?) --- */
function initTour() {
    const steps = [
        { sel: '.quick-start', tab: 'config', title: 'Snel beginnen', body: 'Geen zin in een leeg scherm? Klik op een voorbeeld (Uurtarief, Project of Abonnement) om meteen regels te vullen die je daarna aanpast.' },
        { sel: '#logo-dropzone', tab: 'config', title: 'Jouw huisstijl', body: 'Upload je logo en kies een accentkleur. Je offerte krijgt automatisch jouw uitstraling, ook in de PDF.' },
        { sel: '#sender-form', tab: 'config', title: 'Jouw gegevens', body: 'Vul je bedrijfsnaam en contactgegevens in. Deze komen netjes bovenaan de offerte te staan.' },
        { sel: '#client-form', tab: 'config', title: 'De klant', body: 'Voor wie is de offerte? Vul hier de naam en gegevens van je klant in.' },
        { sel: '.items-section', tab: 'config', title: 'De regels', body: 'Het hart van je offerte. Voeg per onderdeel een omschrijving, aantal, prijs en BTW toe. Het totaal rekent zichzelf uit, je ziet het meteen.' },
        { sel: '#download-trigger', tab: 'preview', title: 'Downloaden', body: 'Tevreden? Klik op Download PDF om je offerte als nette PDF op te slaan en naar je klant te sturen.' },
    ];

    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.style.display = 'none';
    const spot = document.createElement('div');
    spot.className = 'tour-spot';
    overlay.appendChild(spot);
    const tip = document.createElement('div');
    tip.className = 'tour-tip';
    tip.style.display = 'none';
    tip.innerHTML = `
        <h4 class="tour-title"></h4>
        <p class="tour-body"></p>
        <div class="tour-foot">
            <span class="tour-step-count"></span>
            <div class="tour-btns">
                <button class="tour-prev" type="button">Vorige</button>
                <button class="tour-next" type="button">Volgende</button>
            </div>
        </div>
        <button class="tour-skip" type="button">Overslaan</button>`;
    document.body.appendChild(overlay);
    document.body.appendChild(tip);

    const isMobile = () => window.innerWidth <= 768;
    const setTab = (tab) => {
        const layout = document.querySelector('.gen3-layout');
        if (!layout) return;
        layout.classList.toggle('tab-config', tab === 'config');
        layout.classList.toggle('tab-preview', tab === 'preview');
        document.querySelectorAll('.mn-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    };

    let idx = 0;
    const close = () => {
        overlay.style.display = 'none';
        tip.style.display = 'none';
        try { localStorage.setItem('offertje_tour_seen', '1'); } catch (e) { /* ignore */ }
    };

    const position = (el) => {
        const r = el.getBoundingClientRect();
        const pad = 8;
        spot.style.left = Math.max(4, r.left - pad) + 'px';
        spot.style.top = Math.max(4, r.top - pad) + 'px';
        spot.style.width = Math.min(window.innerWidth - 8, r.width + pad * 2) + 'px';
        spot.style.height = (r.height + pad * 2) + 'px';

        tip.style.display = 'block';
        const tr = tip.getBoundingClientRect();
        let top = r.bottom + 14;
        if (top + tr.height > window.innerHeight - 10) top = Math.max(10, r.top - tr.height - 14);
        let left = r.left;
        if (left + tr.width > window.innerWidth - 10) left = window.innerWidth - tr.width - 10;
        if (left < 10) left = 10;
        tip.style.top = top + 'px';
        tip.style.left = left + 'px';
    };

    const show = () => {
        const step = steps[idx];
        if (isMobile() && step.tab) setTab(step.tab);
        overlay.style.display = 'block';
        const el = document.querySelector(step.sel);
        if (!el) { if (idx < steps.length - 1) { idx++; show(); } else close(); return; }
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        tip.querySelector('.tour-title').textContent = step.title;
        tip.querySelector('.tour-body').textContent = step.body;
        tip.querySelector('.tour-step-count').textContent = `Stap ${idx + 1} van ${steps.length}`;
        tip.querySelector('.tour-prev').style.visibility = idx === 0 ? 'hidden' : 'visible';
        tip.querySelector('.tour-next').textContent = idx === steps.length - 1 ? 'Klaar' : 'Volgende';
        setTimeout(() => position(el), 340);
    };

    tip.querySelector('.tour-next').addEventListener('click', () => { if (idx < steps.length - 1) { idx++; show(); } else close(); });
    tip.querySelector('.tour-prev').addEventListener('click', () => { if (idx > 0) { idx--; show(); } });
    tip.querySelector('.tour-skip').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.style.display === 'block') close(); });
    window.addEventListener('resize', () => { if (overlay.style.display === 'block') { const el = document.querySelector(steps[idx].sel); if (el) position(el); } });

    const start = () => { idx = 0; show(); };
    const btn = $('tour-btn');
    if (btn) btn.addEventListener('click', start);

    // First-time visitors get the tour automatically (once).
    try {
        if (!localStorage.getItem('offertje_tour_seen')) setTimeout(start, 800);
    } catch (e) { /* ignore */ }
}

function renderItemsUI() {
    const list = $('items-list');
    list.innerHTML = '';
    state.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="row-top">
                <input type="text" class="i-desc" value="${escapeHtml(item.description)}" placeholder="Omschrijving">
                <button class="btn-dup" type="button" title="Dupliceer regel" aria-label="Dupliceer regel">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
                </button>
                <button class="btn-remove" type="button" title="Verwijder regel" aria-label="Verwijder regel">×</button>
            </div>
            <div class="row-bot">
                <div class="input-group-mini" style="flex:0 0 52px" title="Aantal">
                    <input type="text" inputmode="decimal" class="i-qty" value="${item.quantity}" placeholder="#">
                </div>
                <div class="input-group-mini" style="flex:0 0 58px" title="Eenheid">
                     <input type="text" class="i-unit" value="${escapeHtml(item.unit || '')}" placeholder="Eenh.">
                </div>
                <div class="input-group-mini" style="flex:1 1 110px; min-width:110px" title="Prijs per stuk">
                    <input type="text" inputmode="decimal" class="i-price" value="${item.price}" placeholder="Prijs &euro;">
                </div>
                <div class="input-group-mini" style="flex:0 0 52px" title="Korting %">
                    <input type="number" class="i-disc" value="${item.discount}" placeholder="-%" min="0" max="100">
                </div>
                <div class="select-wrapper" style="flex:0 0 68px; min-width:68px" title="BTW-tarief">
                    <select class="i-vat">
                        <option value="21" ${Number(item.vat) === 21 ? 'selected' : ''}>21%</option>
                        <option value="9" ${Number(item.vat) === 9 ? 'selected' : ''}>9%</option>
                        <option value="0" ${Number(item.vat) === 0 ? 'selected' : ''}>0%</option>
                    </select>
                </div>
                <div class="select-wrapper" style="flex:0 0 112px; min-width:112px">
                    <select class="i-period">
                        <option value="one-off" ${item.period === 'one-off' ? 'selected' : ''}>Eenmalig</option>
                        <option value="weekly" ${item.period === 'weekly' ? 'selected' : ''}>Wekelijks</option>
                        <option value="monthly" ${item.period === 'monthly' ? 'selected' : ''}>Maandelijks</option>
                        <option value="quarterly" ${item.period === 'quarterly' ? 'selected' : ''}>Kwartaal</option>
                        <option value="yearly" ${item.period === 'yearly' ? 'selected' : ''}>Jaarlijks</option>
                    </select>
                </div>
            </div>
        `;

        const bind = (sel, field, numeric = false) => {
            const el = row.querySelector(sel);
            if (el) el.addEventListener('input', (e) => {
                item[field] = numeric ? parseNum(e.target.value) : e.target.value;
                updatePreview();
            });
        };
        bind('.i-desc', 'description');
        bind('.i-qty', 'quantity', true);
        bind('.i-unit', 'unit');
        bind('.i-price', 'price', true);
        bind('.i-disc', 'discount', true);

        row.querySelector('.i-vat').addEventListener('change', (e) => { item.vat = Number(e.target.value); updatePreview(); });
        row.querySelector('.i-period').addEventListener('change', (e) => { item.period = e.target.value; updatePreview(); });

        const dupBtn = row.querySelector('.btn-dup');
        if (dupBtn) dupBtn.addEventListener('click', () => {
            const idx = state.items.findIndex((i) => i.id === item.id);
            state.items.splice(idx + 1, 0, { ...item, id: Date.now() });
            renderItemsUI();
            updatePreview();
        });

        row.querySelector('.btn-remove').addEventListener('click', () => {
            state.items = state.items.filter(i => i.id !== item.id);
            renderItemsUI();
            updatePreview();
        });
        list.appendChild(row);
    });
}

/* --- PREVIEW LOGIC --- */
function updatePreview() {
    // 1. Logo in the document header
    const logoArea = $('preview-logo');
    if (logoArea) {
        logoArea.innerHTML = state.branding.logo
            ? `<img src="${state.branding.logo}" alt="Logo" style="max-height: 80px; width: auto; display: block;">`
            : '';
    }

    // 2. Meta
    setText('prev-doc-title', state.meta.title || 'OFFERTE');
    setText('prev-ref', state.meta.number);
    setText('prev-date', state.meta.date);
    setText('prev-valid', state.meta.validUntil || '-');
    const projLine = $('prev-project-line');
    if (state.meta.project) {
        projLine.innerHTML = `<span class="proj-label">Betreft project:</span> <strong>${state.meta.project}</strong>`;
        projLine.style.display = 'block';
    } else { projLine.style.display = 'none'; }

    // 3. Address (preview-only placeholders guide first-time users; the PDF stays clean)
    const senderHtml = buildAddressBlock(state.sender);
    const senderBlock = $('prev-sender-block');
    if (senderBlock) {
        senderBlock.innerHTML = state.sender.company
            ? `<strong>${escapeHtml(state.sender.company)}</strong>${senderHtml}`
            : `<strong class="prev-ph">Je bedrijfsnaam</strong>`;
    }

    const clientHtml = buildAddressBlock(state.client);
    const clientBlock = $('prev-client-block');
    if (clientBlock) {
        const hasClient = state.client.company || state.client.contact || state.client.address;
        clientBlock.innerHTML = hasClient
            ? `
            <strong>${escapeHtml(state.client.company || '')}</strong>
            ${state.client.contact ? `<div>T.a.v. ${escapeHtml(state.client.contact)}</div>` : ''}
            ${clientHtml}
            ${state.client.reference ? `<div style="margin-top:0.5rem; font-size:0.8em; color:#6B7280">Ref: ${escapeHtml(state.client.reference)}</div>` : ''}
        `
            : `<strong class="prev-ph">Naam van je klant</strong>`;
    }

    // 4. Items & Financials
    renderItemsTable();

    // 5. Notes
    const notesEl = $('prev-notes');
    if (notesEl) notesEl.innerHTML = state.notes ? state.notes.replace(/\n/g, '<br>') : '';

    // 6. Footer
    renderFooter();

    // SAVE STATE (For Payment Return)
    localStorage.setItem('offertje_state', JSON.stringify(state));
    flashSaved();
}

function loadState() {
    const saved = localStorage.getItem('offertje_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(state, parsed);
            // Inputs are managed via state updates triggering renders
            restoreInputs(); // FIX: Sync DOM inputs with loaded state
        } catch (e) { console.error('State load error', e); }
    }
}

function restoreInputs() {
    // 1. Sender
    Object.keys(state.sender).forEach(key => {
        const input = document.querySelector(`#sender-form [name="${key}"]`);
        if (input) input.value = state.sender[key] || '';
    });

    // 2. Client
    Object.keys(state.client).forEach(key => {
        const input = document.querySelector(`#client-form [name="${key}"]`);
        if (input) input.value = state.client[key] || '';
    });

    // 3. Meta
    Object.keys(state.meta).forEach(key => {
        const input = document.querySelector(`#meta-form [name="${key}"]`);
        if (input) input.value = state.meta[key] || '';
    });

    // 4. Branding Color
    const colorInput = $('accent-color');
    if (colorInput && state.branding.primaryColor) {
        colorInput.value = state.branding.primaryColor;
        document.documentElement.style.setProperty('--accent', state.branding.primaryColor);
        // Highlight active preset if matches
        $$('.c-opt').forEach(btn => {
            if (btn.dataset.color === state.branding.primaryColor) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    // 5. Logo UI
    const dropzone = $('logo-dropzone');
    if (state.branding.logo && dropzone) {
        updateLogoUI(dropzone, state.branding.logo);
    }

    // 6. Notes
    const notesInput = $('notes-input');
    if (notesInput) notesInput.value = state.notes || '';
}


function buildAddressBlock(data) {
    let html = '';
    if (data.address) html += `<span>${escapeHtml(data.address)}</span>`;
    if (data.zip || data.city) html += `<span>${escapeHtml(`${data.zip || ''} ${data.city || ''}`.trim())}</span>`;
    return html;
}

function renderItemsTable() {
    const paperBody = document.querySelector('.paper-body');
    if (!paperBody) return;
    const addressGrid = paperBody.querySelector('.address-grid');
    const notesSection = paperBody.querySelector('#prev-notes');

    paperBody.innerHTML = '';
    if (addressGrid) paperBody.appendChild(addressGrid);

    // Single source of truth: same calculation as the PDF (calc.js)
    const q = computeQuote(state);
    const accent = state.branding.primaryColor;
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

    q.activeGroups.forEach((group) => {
        const container = document.createElement('div');
        container.className = 'group-section';

        const header = document.createElement('h3');
        header.className = 'group-header';
        header.textContent = group.label;
        header.style.color = accent;
        container.appendChild(header);

        const table = document.createElement('table');
        table.className = 'modern-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th class="col-desc">Omschrijving</th>
                    <th class="col-qty right">Aantal</th>
                    <th class="col-price right">Prijs</th>
                    <th class="col-vat right">BTW</th>
                    <th class="col-total right">Totaal</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        group.items.forEach((item) => {
            const c = item._calc;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight:500">${esc(item.description)}</div>
                    ${c.disc > 0 ? `<div style="font-size:0.75em; color:#EF4444">Korting: ${c.disc}%</div>` : ''}
                </td>
                <td class="right">
                    ${c.qty}
                    <span style="font-size:0.8em; color:#9CA3AF">${esc(item.unit || '')}</span>
                </td>
                <td class="right">${fmtEUR(c.price)}</td>
                <td class="right">${c.vat}%</td>
                <td class="right">${fmtEUR(c.exVat)}</td>
            `;
            tbody.appendChild(tr);
        });

        container.appendChild(table);

        if (group.key !== 'one-off') {
            const totalRow = document.createElement('div');
            totalRow.className = 'group-total recurring';
            const suffix = group.suffix ? ` <span style="color:#94a3b8; font-weight:500">${group.suffix}</span>` : '';
            totalRow.innerHTML = `<span>Totaal ${group.label.toLowerCase()} (excl. btw)</span> <span>${fmtEUR(group.subtotal)}${suffix}</span>`;
            container.appendChild(totalRow);
        }

        paperBody.appendChild(container);
    });

    // TOTALS for one-off
    if (q.oneOff.items.length > 0) {
        const totalsSec = document.createElement('div');
        totalsSec.className = 'totals-section';
        totalsSec.style.borderTopColor = accent;

        const subRow = `
            <div class="total-row">
                <span>Subtotaal (excl. btw)</span>
                <span>${fmtEUR(q.grandSubtotal)}</span>
            </div>
        `;

        let vatRows = '';
        Object.keys(q.vatBuckets)
            .sort((a, b) => Number(a) - Number(b))
            .forEach((rate) => {
                if (q.vatBuckets[rate] !== 0) {
                    vatRows += `
                    <div class="total-row">
                        <span>btw ${rate}%</span>
                        <span>${fmtEUR(q.vatBuckets[rate])}</span>
                    </div>`;
                }
            });

        const totalRow = `
             <div class="total-row final" style="color:${accent}">
                <span>Totaal (incl. btw)</span>
                <span>${fmtEUR(q.grandTotal)}</span>
            </div>
        `;

        totalsSec.innerHTML = subRow + vatRows + totalRow;
        paperBody.appendChild(totalsSec);
    }

    state.total = q.grandTotal;

    const liveAmt = $('live-total-amt');
    if (liveAmt) {
        let txt = fmtEUR(q.grandTotal);
        const monthly = q.groups['monthly'];
        if (monthly && monthly.subtotal > 0) txt += ` + ${fmtEUR(monthly.subtotal)}/mnd`;
        liveAmt.textContent = txt;
    }

    if (notesSection) paperBody.appendChild(notesSection);
}

function renderFooter() {
    const c1 = $('f-col-1');
    const c2 = $('f-col-2');
    const c3 = $('f-col-3');
    if (!c1) return;

    c1.innerHTML = `
        <strong>Contact</strong>
        <div>${state.sender.company || ''}</div>
        <div>${state.sender.email || ''}</div>
        <div>${state.sender.phone || ''}</div>
         <div>${state.sender.website || ''}</div>
    `;

    c2.innerHTML = `
        <strong>Bedrijfsgegevens</strong>
        ${state.sender.kvk ? `<div>KVK: ${state.sender.kvk}</div>` : ''}
        ${state.sender.vat ? `<div>BTW: ${state.sender.vat}</div>` : ''}
        ${state.sender.iban ? `<div>IBAN: ${state.sender.iban}</div>` : ''}
    `;

    c3.innerHTML = `
        <strong>Geldigheid</strong>
        <div>Offerte geldig tot:<br>${state.meta.validUntil || '30 dagen na dagtekening'}</div>
        <div style="margin-top:0.5rem">Op al onze diensten zijn de algemene voorwaarden van toepassing.</div>
    `;

    // Signature Section (Dynamic with State)
    const paperBody = document.querySelector('.paper-body');
    const existingSig = paperBody.querySelector('.signature-section');
    if (existingSig) existingSig.remove();

    const sigSection = document.createElement('div');
    sigSection.className = 'signature-section';

    // Check if we have a signature image in state
    const senderSigHtml = state.signatureImage
        ? `<img src="${state.signatureImage}" style="display:block; max-height:60px; margin-bottom:-10px; position:relative; z-index:5;" alt="Handtekening">`
        : '';

    sigSection.innerHTML = `
        <div class="sig-block">
            ${senderSigHtml}
            <div class="sig-line"></div>
            <div class="sig-label">Voor akkoord <br><strong>${state.sender.company || 'Opdrachtnemer'}</strong></div>
            <div class="sig-date">Datum: ${state.meta.date || formatNlDate(new Date())}</div>
        </div>
        <div class="sig-block">
            <div style="height:60px; display:block;"></div> <!-- Spacer -->
            <div class="sig-line"></div>
            <div class="sig-label">Voor akkoord <br><strong>${state.client.company || 'Opdrachtgever'}</strong></div>
            <div class="sig-date">Datum: ...........................</div>
        </div>
    `;

    // Insert (if setting enabled)
    if (state.settings.showSignature !== false) {
        paperBody.appendChild(sigSection);
    }
}

function setText(id, val) {
    const el = $(id);
    if (el) el.textContent = val;
}

/* --- ZOOM & MODAL & HELPERS --- */
function initPreviewZoom() {
    let zoom = 1;
    const page = $('pdf-preview');
    if (!page) return;
    const lbl = document.querySelector('.zoom-lbl');
    const apply = () => {
        page.style.transform = `scale(${zoom})`;
        if (lbl) lbl.textContent = Math.round(zoom * 100) + '%';
    };
    const zin = $('zoom-in'); const zout = $('zoom-out');
    if (zin) zin.addEventListener('click', () => { if (zoom < 1.5) { zoom = Math.round((zoom + 0.1) * 10) / 10; apply(); } });
    if (zout) zout.addEventListener('click', () => { if (zoom > 0.5) { zoom = Math.round((zoom - 0.1) * 10) / 10; apply(); } });
}

let modalRightHTML = null;

function initModal() {
    const mr = document.querySelector('.modal-right');
    if (mr) modalRightHTML = mr.innerHTML; // remember the payment panel
    const dl = $('download-trigger');
    if (dl) dl.addEventListener('click', openModal);
    const mc = $('modal-close');
    if (mc) mc.addEventListener('click', closeModal);
}

function fillModalThumb() {
    const thumbBox = $('modal-thumb');
    const original = $('pdf-preview');
    if (thumbBox && original) {
        thumbBox.innerHTML = '';
        thumbBox.appendChild(original.cloneNode(true));
    }
}

function showModal() {
    const modal = $('payment-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
}

function quoteIsEmpty() {
    return !state.items.some((i) => (i.description && i.description.trim()) || Number(i.price) > 0);
}

function openModal() {
    if (quoteIsEmpty()) {
        alert('Vul eerst je offerte in: voeg minstens een regel met een omschrijving of prijs toe.');
        return;
    }
    // Restore the payment panel (it may have been swapped to the success view).
    const mr = document.querySelector('.modal-right');
    if (mr && modalRightHTML != null) mr.innerHTML = modalRightHTML;

    fillModalThumb();
    showModal();
    mountCheckout();
}

function showPaymentSuccess() {
    fillModalThumb();
    const mr = document.querySelector('.modal-right');
    if (mr) {
        mr.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:flex-start;">
                <div style="width:56px; height:56px; border-radius:50%; background:#dcfce7; color:#16a34a; display:flex; align-items:center; justify-content:center; margin-bottom:1.25rem;">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h2 style="margin:0 0 0.4rem;">Betaling geslaagd</h2>
                <p style="color:#64748B; font-size:0.92rem; margin:0 0 1.5rem;">Je offerte staat klaar. Klik hieronder om de PDF te downloaden.</p>
                <button class="btn-primary" id="download-paid" style="width:100%;">Download offerte (PDF)</button>
                <button id="success-close" style="background:none; border:none; color:#94a3b8; cursor:pointer; text-decoration:underline; font-family:inherit; margin-top:0.9rem; font-size:0.85rem;">Sluiten</button>
            </div>`;
        const dl = $('download-paid');
        if (dl) dl.addEventListener('click', () => generatePDF(state));
        const sc = $('success-close');
        if (sc) sc.addEventListener('click', closeModal);
    }
    showModal();
}

function closeModal() {
    const modal = $('payment-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

const stripePromise = Stripe('pk_test_51Suu3SBsNgRS4dt78EEy63mwHhi29Rc1lSdDmj2xGvwHkHonR6z2SAn25pNfCwgaVFYr7DagJZ8mc8nmBwA0bhEv00STzG4iuO');
let checkout = null;

async function mountCheckout() {
    const mountPoint = document.getElementById('checkout-mount');
    if (!mountPoint) return;

    // Reset/Loading
    mountPoint.innerHTML = '<div style="padding:2rem;text-align:center;color:#64748B">Laden van betaalmodule...</div>';

    try {
        const amount = 0.50; // Fixed Service Fee
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: state.items, amount: amount })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Payment API Error:', errText);
            throw new Error(`API Refused: ${response.status} ${errText}`);
        }

        const { clientSecret } = await response.json();

        if (clientSecret) {
            const stripe = await stripePromise;
            checkout = await stripe.initEmbeddedCheckout({
                clientSecret,
            });
            mountPoint.innerHTML = ''; // Clear loading text
            checkout.mount('#checkout-mount');
        } else {
            console.error('No Client Secret');
            mountPoint.innerHTML = '<div style="color:red">Fout: Geen betaalsessie ontvangen.</div>';
        }
    } catch (e) {
        console.error('Mount Critical Error', e);
        mountPoint.innerHTML = `<div style="color:red; font-size: 0.8rem; padding: 1rem;">
            Fout bij laden betaling.<br>
            <small>${e.message || e}</small><br>
            <button onclick="mountCheckout()" style="margin-top:10px; padding: 5px 10px;">Probeer opnieuw</button>
        </div>`;
    }
}

// --- INIT MOBILE ZOOM & MODAL LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Zoom
    const slider = document.getElementById('mobile-zoom-slider');
    const paper = document.querySelector('.paper-a4');

    if (slider && paper) {
        if (window.innerWidth <= 768) {
            const startScale = (window.innerWidth - 32) / 794;
            slider.value = startScale;
            applyZoom(startScale);
        }

        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            applyZoom(val);
        });

        function applyZoom(scale) {
            paper.style.transform = `scale(${scale})`;
            const wrapper = document.querySelector('.paper-wrapper');
            if (wrapper) {
                const baseW = 794;
                const baseH = 1123;
                const scaledW = baseW * scale;
                const scaledH = baseH * scale;

                wrapper.style.width = `${scaledW}px`;
                wrapper.style.height = `${scaledH}px`;
            }
        }
    }

    // Modal Close Logic
    const modalBg = document.querySelector('.modal-bg');
    if (modalBg) {
        modalBg.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // --- SIGNATURE PAD LOGIC (ROBUST V2) ---
    const sigCanvas = document.getElementById('signature-pad');
    const undoBtn = document.getElementById('sig-undo');
    const redoBtn = document.getElementById('sig-redo');
    const clearBtn = document.getElementById('clear-sig');

    if (sigCanvas) {
        const ctx = sigCanvas.getContext('2d');
        if (!state.signatureImage) state.signatureImage = '';

        let isDrawing = false;
        let history = [];
        let historyStep = -1;

        // 1. High DPI / Retina Fix
        function resizeCanvas() {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const rect = sigCanvas.parentElement.getBoundingClientRect();
            sigCanvas.width = rect.width * ratio;
            sigCanvas.height = rect.height * ratio;
            ctx.scale(ratio, ratio);

            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            history = [];
            historyStep = -1;
            state.signatureImage = '';
            renderFooter();
            updateButtons();
        }

        setTimeout(resizeCanvas, 200);

        // 2. Coords
        function getCoords(e) {
            const rect = sigCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        // 3. Drawing
        function startDraw(e) {
            e.preventDefault();
            isDrawing = true;
            const coords = getCoords(e);
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
        }

        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const coords = getCoords(e);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
        }

        function stopDraw() {
            if (isDrawing) {
                isDrawing = false;
                ctx.closePath();
                saveState();
            }
        }

        // 4. History & State Sync
        function saveState() {
            historyStep++;
            if (historyStep < history.length) { history.length = historyStep; }
            const data = sigCanvas.toDataURL();
            history.push(data);

            state.signatureImage = data;
            renderFooter();
            updateButtons();
        }

        function restoreState(dataUrl) {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.drawImage(img, 0, 0);
                ctx.restore();

                state.signatureImage = dataUrl;
                renderFooter();
            };
        }

        function undo() {
            if (historyStep > 0) {
                historyStep--;
                restoreState(history[historyStep]);
            } else {
                historyStep = -1;
                ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
                ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height); ctx.restore();

                state.signatureImage = '';
                renderFooter();
            }
            updateButtons();
        }

        function redo() {
            if (historyStep < history.length - 1) {
                historyStep++;
                restoreState(history[historyStep]);
            }
            updateButtons();
        }

        function updateButtons() {
            if (undoBtn) undoBtn.style.opacity = historyStep >= 0 ? '1' : '0.5';
            if (redoBtn) redoBtn.style.opacity = historyStep < history.length - 1 ? '1' : '0.5';
        }

        // Listeners
        sigCanvas.addEventListener('mousedown', startDraw);
        sigCanvas.addEventListener('mousemove', draw);
        sigCanvas.addEventListener('mouseup', stopDraw);
        sigCanvas.addEventListener('mouseout', stopDraw);
        sigCanvas.addEventListener('touchstart', startDraw);
        sigCanvas.addEventListener('touchmove', draw);
        sigCanvas.addEventListener('touchend', stopDraw);

        if (undoBtn) undoBtn.addEventListener('click', undo);
        if (redoBtn) redoBtn.addEventListener('click', redo);
        if (clearBtn) clearBtn.addEventListener('click', () => {
            historyStep = -1;
            history = [];
            ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height); ctx.restore();
            state.signatureImage = '';
            renderFooter();
            updateButtons();
        });
    }
});
