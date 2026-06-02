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

    // Check if we just paid
    checkPaymentSuccess();

    initMobileTabs();

    const resetBtn = $('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetAll);

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

function renderItemsUI() {
    const list = $('items-list');
    list.innerHTML = '';
    state.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="row-top">
                <input type="text" class="i-desc" value="${item.description}" placeholder="Omschrijving">
                <button class="btn-remove">×</button>
            </div>
            <div class="row-bot">
                <div class="input-group-mini" style="flex:0 0 50px">
                    <input type="text" inputmode="decimal" class="i-qty" value="${item.quantity}" placeholder="#">
                </div>
                <div class="input-group-mini" style="flex:0 0 60px">
                     <input type="text" class="i-unit" value="${item.unit || ''}" placeholder="Eenh.">
                </div>
                <div class="input-group-mini" style="flex:1">
                    <input type="text" inputmode="decimal" class="i-price" value="${item.price}" placeholder="Prijs">
                </div>
                <div class="input-group-mini" style="flex:0 0 48px" title="Korting %">
                    <input type="number" class="i-disc" value="${item.discount}" placeholder="-%" min="0" max="100">
                </div>
                <div class="select-wrapper" style="flex:0 0 66px" title="BTW-tarief">
                    <select class="i-vat">
                        <option value="21" ${Number(item.vat) === 21 ? 'selected' : ''}>21%</option>
                        <option value="9" ${Number(item.vat) === 9 ? 'selected' : ''}>9%</option>
                        <option value="0" ${Number(item.vat) === 0 ? 'selected' : ''}>0%</option>
                    </select>
                </div>
                <div class="select-wrapper" style="flex:0 0 105px">
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

    // 3. Address
    const senderHtml = buildAddressBlock(state.sender);
    const senderBlock = $('prev-sender-block');
    // FIX: Remove 'Jouw Bedrijf' fallback. Empty is empty.
    if (senderBlock) senderBlock.innerHTML = `<strong>${state.sender.company || ''}</strong>${senderHtml}`;

    const clientHtml = buildAddressBlock(state.client);
    const clientBlock = $('prev-client-block');
    if (clientBlock) {
        // FIX: Remove 'De Klant' fallback.
        clientBlock.innerHTML = `
            <strong>${state.client.company || ''}</strong>
            ${state.client.contact ? `<div>T.a.v. ${state.client.contact}</div>` : ''}
            ${clientHtml}
            ${state.client.reference ? `<div style="margin-top:0.5rem; font-size:0.8em; color:#6B7280">Ref: ${state.client.reference}</div>` : ''}
        `;
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
    if (data.address) html += `<span>${data.address}</span>`;
    if (data.zip || data.city) html += `<span>${data.zip || ''} ${data.city || ''}</span>`;
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
    $('zoom-in').addEventListener('click', () => { if (zoom < 1.4) { zoom += 0.1; page.style.transform = `scale(${zoom})`; } });
    $('zoom-out').addEventListener('click', () => { if (zoom > 0.6) { zoom -= 0.1; page.style.transform = `scale(${zoom})`; } });
}

function initModal() {
    ['download-trigger'].forEach(t => { const btn = $(t); if (btn) btn.addEventListener('click', openModal); });
    $('modal-close').addEventListener('click', closeModal);
}

function openModal() {
    const modal = $('payment-modal');
    const thumbBox = $('modal-thumb');
    const original = $('pdf-preview');
    if (!modal || !original) return;

    // Preview
    const clone = original.cloneNode(true);
    thumbBox.innerHTML = '';
    thumbBox.appendChild(clone);

    // Show Modal
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);

    // AUTO MOUNT PAYMENT
    mountCheckout();
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
