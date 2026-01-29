import { generatePDF } from './pdf-gen.js';

/* --- STATE MANAGEMENT --- */
const state = {
    sender: {
        company: '', contact: '', address: '', zip: '', city: '', country: '',
        email: '', phone: '', website: '', kvk: '', vat: '', iban: ''
    },
    client: {
        company: '', contact: '', address: '', zip: '', city: '', country: '',
        email: '', phone: '', kvk: '', vat: '', reference: ''
    },
    meta: {
        number: '2026-001', date: new Date().toLocaleDateString('nl-NL'),
        validUntil: '', title: 'Quotify', project: '',
        currency: 'EUR', status: 'concept'
    },
    branding: { logo: null, primaryColor: '#0F172A' },
    items: [],
    settings: {
        paymentTerm: 14,
        showSignature: true
    },
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
    updatePreview();

    console.log('OfferteGeneratory Gen 3 :: Initialized');
    console.log('VERSION: 2.2.0 - MOBILE UX LIVE');
});

function initMobileTabs() {
    const layout = document.querySelector('.gen3-layout');
    const btns = document.querySelectorAll('.mn-btn');

    // Default
    if (window.innerWidth <= 768) {
        layout.classList.add('tab-config');
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
        });
    });
}

async function checkPaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
        console.log('Payment success detected:', sessionId);

        // Wait for UI to stabilize
        setTimeout(() => {
            alert('Betaling geslaagd! Uw PDF wordt gegenereerd.');
            generatePDF(state);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 800);
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
                updatePreview();
            }
        });
    });

    const dateInput = $('meta-date');
    if (dateInput) dateInput.addEventListener('change', (e) => { state.meta.date = e.target.value; updatePreview(); });

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
        dropzone.addEventListener('click', () => logoInput.click());
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    state.branding.logo = evt.target.result;

                    // Calc Brightness
                    state.branding.logoBri = await getImageBrightness(state.branding.logo);

                    const icon = dropzone.querySelector('.icon');
                    const text = dropzone.querySelector('span');
                    if (icon) icon.textContent = '✓';
                    if (text) text.textContent = 'Logo ingesteld';
                    dropzone.style.borderColor = state.branding.primaryColor;
                    dropzone.style.background = '#F0FDF4';
                    updatePreview();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const dlBtn = $('download-trigger');
    // const dlBtn = $('download-trigger'); // Removed duplicate
    // if (dlBtn) dlBtn.addEventListener('click', () => generatePDF(state)); // REMOVED: Managed by initModal now

    const notesInput = $('notes-input');
    if (notesInput) notesInput.addEventListener('input', (e) => { state.notes = e.target.value; updatePreview(); });
}

function setCurrentDate() {
    state.meta.date = new Date().toLocaleDateString('nl-NL');
    if ($('meta-date')) $('meta-date').value = state.meta.date;
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
        state.items.push({
            id: 1, description: 'Website Design & Development', price: 2500, quantity: 1,
            unit: 'project', vat: 21, discount: 0, period: 'one-off'
        });
        renderItemsUI();
    }
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
                    <input type="number" class="i-qty" value="${item.quantity}" placeholder="#">
                </div>
                <div class="input-group-mini" style="flex:0 0 60px">
                     <input type="text" class="i-unit" value="${item.unit || ''}" placeholder="Eenh.">
                </div>
                <div class="input-group-mini" style="flex:1">
                    <input type="number" class="i-price" value="${item.price}" placeholder="Prijs">
                </div>
                <div class="input-group-mini" style="flex:0 0 50px" title="Korting %">
                    <input type="number" class="i-disc" value="${item.discount}" placeholder="-%">
                </div>
                <div class="input-group-mini" style="flex:0 0 50px" title="BTW %">
                    <input type="number" class="i-vat" value="${item.vat}" placeholder="BTW">
                </div>
                <div class="select-wrapper" style="width:105px">
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
                item[field] = numeric ? Number(e.target.value) : e.target.value;
                updatePreview();
            });
        };
        bind('.i-desc', 'description');
        bind('.i-qty', 'quantity', true);
        bind('.i-unit', 'unit');
        bind('.i-price', 'price', true);
        bind('.i-disc', 'discount', true);
        bind('.i-vat', 'vat', true);

        row.querySelector('.i-period').addEventListener('change', (e) => { item.period = e.target.value; updatePreview(); });
        row.querySelector('.btn-remove').addEventListener('click', () => {
            state.items = state.items.filter(i => i.id !== item.id);
            renderItemsUI();
            updatePreview();
        });
        list.appendChild(row);
    });
}

/* --- HELPERS --- */
function getHexBrightness(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
}

function getImageBrightness(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 50; // Scale down for speed
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 50, 50);
            const data = ctx.getImageData(0, 0, 50, 50).data;
            let total = 0, count = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 20) { // Ignore transparent pixels
                    const bri = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
                    total += bri;
                    count++;
                }
            }
            resolve(count === 0 ? 255 : total / count); // Default white if empty
        };
        img.onerror = () => resolve(128);
    });
}


/* --- PREVIEW LOGIC --- */
function updatePreview() {
    // 1. Logo
    const logoArea = $('preview-logo');
    if (state.branding.logo) {
        logoArea.innerHTML = `<img src="${state.branding.logo}">`;
        logoArea.classList.add('has-logo');
        const existingWatermark = document.querySelector('.watermark-logo');
        if (existingWatermark) existingWatermark.remove();
        const watermark = document.createElement('div');
        watermark.className = 'watermark-logo';
        watermark.innerHTML = `<img src="${state.branding.logo}">`;
        $('pdf-preview').prepend(watermark);
    }

    // SMART CONTRAST CHECK
    const header = document.querySelector('.paper-header');
    if (state.branding.logo && typeof state.branding.logoBri === 'number') {
        const bgBri = getHexBrightness(state.branding.primaryColor);
        const logoBri = state.branding.logoBri;

        // Threshold: < 128 is Dark, > 128 is Light
        const isBgDark = bgBri < 140;
        const isLogoDark = logoBri < 140;

        // COLLISION DETECTED: Dark Logo on Dark BG
        if (isBgDark && isLogoDark) {
            header.classList.add('force-light');
            header.classList.remove('force-dark');
        }
        // COLLISION: Light Logo on Light BG
        else if (!isBgDark && !isLogoDark) {
            header.classList.add('force-dark'); // Force dark accent or black?
            header.classList.remove('force-light');
        } else {
            header.classList.remove('force-light', 'force-dark');
        }
    } else {
        header.classList.remove('force-light', 'force-dark');
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
    if (senderBlock) senderBlock.innerHTML = `<strong>${state.sender.company || 'Jouw Bedrijf'}</strong>${senderHtml}`;

    const clientHtml = buildAddressBlock(state.client);
    const clientBlock = $('prev-client-block');
    if (clientBlock) {
        clientBlock.innerHTML = `
            <strong>${state.client.company || 'De Klant'}</strong>
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
    localStorage.setItem('quotify_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('quotify_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge carefully or overwrite? Overwrite is safest for restore.
            Object.assign(state, parsed);
            // Restore UI inputs
            if ($('sender-company')) $('sender-company').value = state.sender.company || '';
            // ... (A full restore would be tedious mapping every input)
            // But updatePreview uses 'state' to render the PDF. 
            // So as long as 'state' is restored, the PDF will be correct!
            // The inputs might be empty visualy if I don't map them back, 
            // but generatePDF uses 'state'.
            // For MVP: Let's trust 'state' is enough for the PDF.
        } catch (e) { console.error('State load error', e); }
    }
}


function buildAddressBlock(data) {
    let html = '';
    if (data.address) html += `<span>${data.address}</span>`;
    if (data.zip || data.city) html += `<span>${data.zip || ''} ${data.city || ''}</span>`;
    if (data.country) html += `<span>${data.country}</span>`;
    return html;
}

function renderItemsTable() {
    const paperBody = document.querySelector('.paper-body');
    if (!paperBody) return;
    const addressGrid = paperBody.querySelector('.address-grid');
    const notesSection = paperBody.querySelector('#prev-notes');

    paperBody.innerHTML = '';
    if (addressGrid) paperBody.appendChild(addressGrid);

    // Grouping & Calc
    const groups = {
        'one-off': { label: 'Eenmalige Investering', items: [], subtotal: 0, vatTotal: 0 },
        'start': { label: 'Opstartkosten', items: [], subtotal: 0, vatTotal: 0 },
        'weekly': { label: 'Wekelijkse Kosten', items: [], subtotal: 0, vatTotal: 0 },
        'monthly': { label: 'Maandelijkse Kosten', items: [], subtotal: 0, vatTotal: 0 },
        'quarterly': { label: 'Kosten per Kwartaal', items: [], subtotal: 0, vatTotal: 0 },
        'yearly': { label: 'Jaarlijkse Kosten', items: [], subtotal: 0, vatTotal: 0 }
    };

    // Tax Buckets just for One-Off usually, but let's track globally or per group? 
    // Usually a quote sums up One-Off costs. Recurring are separate.
    // Let's do a rigorous One-Off calculation.
    let vatBuckets = {};

    state.items.forEach(item => {
        const pd = item.period || 'one-off';
        if (groups[pd]) {
            const raw = item.price * item.quantity;
            const discAmount = raw * ((item.discount || 0) / 100);
            const exVat = raw - discAmount;
            const vatAmount = exVat * ((item.vat || 0) / 100);

            item._calculated = { exVat, vatAmount, total: exVat + vatAmount }; // Store for row render

            groups[pd].items.push(item);
            groups[pd].subtotal += exVat;
            groups[pd].vatTotal += vatAmount;

            if (pd === 'one-off') {
                const vatKey = item.vat || 0;
                if (!vatBuckets[vatKey]) vatBuckets[vatKey] = 0;
                vatBuckets[vatKey] += vatAmount;
            }
        }
    });

    // Render Groups
    Object.keys(groups).forEach(key => {
        const group = groups[key];
        if (group.items.length === 0) return;

        const container = document.createElement('div');
        container.className = 'group-section';

        const header = document.createElement('h3');
        header.className = 'group-header';
        header.textContent = group.label;
        header.style.color = state.branding.primaryColor;
        container.appendChild(header);

        const table = document.createElement('table');
        table.className = 'modern-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th class="col-desc">Omschrijving</th>
                    <th class="col-qty right">Aantal</th>
                    <th class="col-price right">Prijs</th>
                    <th class="col-total right">Totaal</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        group.items.forEach(item => {
            const calc = item._calculated;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight:500">${item.description}</div>
                    ${item.discount > 0 ? `<div style="font-size:0.75em; color:#EF4444">Korting: ${item.discount}%</div>` : ''}
                </td>
                <td class="right">
                    ${item.quantity} 
                    <span style="font-size:0.8em; color:#9CA3AF">${item.unit || ''}</span>
                </td>
                <td class="right">€ ${item.price.toFixed(2)}</td>
                <td class="right">€ ${calc.exVat.toFixed(2)}</td> 
            `;
            tbody.appendChild(tr);
        });

        // If one-off, we do Detailed Summary. If recurring, simple line.
        if (key !== 'one-off') {
            const totalRow = document.createElement('div');
            totalRow.className = 'group-total recurring';
            totalRow.innerHTML = `<span>Totaal ${group.label} (Ex BTW)</span> <span>€ ${group.subtotal.toFixed(2)}</span>`;
            container.appendChild(table);
            container.appendChild(totalRow);
        } else {
            container.appendChild(table);
        }

        paperBody.appendChild(container);
    });

    // TOTALS SECTION for ONE-OFF
    const oneOff = groups['one-off'];
    if (oneOff.items.length > 0) {
        const totalsSec = document.createElement('div');
        totalsSec.className = 'totals-section';
        totalsSec.style.borderTopColor = state.branding.primaryColor;

        const subRow = `
            <div class="total-row">
                <span>Subtotaal (Excl. BTW)</span>
                <span>€ ${oneOff.subtotal.toFixed(2)}</span>
            </div>
        `;

        let vatRows = '';
        Object.keys(vatBuckets).forEach(rate => {
            if (vatBuckets[rate] > 0) {
                vatRows += `
                    <div class="total-row">
                        <span>BTW (${rate}%)</span>
                        <span>€ ${vatBuckets[rate].toFixed(2)}</span>
                    </div>
                `;
            }
        });

        const totalRow = `
             <div class="total-row final" style="color:${state.branding.primaryColor}">
                <span>Totaal (Incl. BTW)</span>
                <span>€ ${(oneOff.subtotal + oneOff.vatTotal).toFixed(2)}</span>
            </div>
        `;

        totalsSec.innerHTML = subRow + vatRows + totalRow;
        paperBody.appendChild(totalsSec);

        state.total = oneOff.subtotal + oneOff.vatTotal;
    } else {
        state.total = 0;
    }

    if (notesSection) paperBody.appendChild(notesSection);

    // Sidebar Summary Update
    let summaryText = `€ ${state.total.toFixed(2)}`;
    // Maybe add monthly?
    if (groups['monthly'].subtotal > 0) {
        summaryText += ` + € ${groups['monthly'].subtotal.toFixed(2)} p/m`;
    }
    // setText('summary-total', summaryText); // REMOVED: This overwrites the Payment Modal Service Fee!
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
    // Removed old confirm button listener
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
    // Cleanup mount to preventing duplicates? 
    // Embedded checkout usually handles destroy, but we can clear innerHTML next open.
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
        const response = await fetch('/api/create-checkout-session', {
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
            // Init with explicit settings sometimes helps Apple Pay
            checkout = await stripe.initEmbeddedCheckout({
                clientSecret,
            });
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
