/* ===========================================================
   Offertje - professional vector PDF generator
   Mirrors the live preview exactly (shared calc.js), supports
   VAT split, discounts, recurring groups, signature, multi-page.
   Works in the browser (window.jspdf) and in Node (inject jsPDF).
   =========================================================== */

import { computeQuote, fmtEUR, hexToRgb } from './calc.js';

const PAGE = { w: 210, h: 297 };
const M = 18; // margin
const RIGHT = PAGE.w - M; // 192
const CONTENT_BOTTOM = PAGE.h - 30; // start a new page below this

// column right-edges (mm) for the items table
const COL = { qty: 118, price: 148, vat: 166, total: RIGHT };
const DESC_W = COL.qty - M - 16; // wrap width for description (clearance before qty column)

const INK = [15, 23, 42];
const GRAY = [100, 116, 139];
const FAINT = [148, 163, 184];
const LINE = [226, 232, 240];

function detectFormat(dataUrl) {
    const m = /^data:image\/(png|jpeg|jpg|webp)/i.exec(dataUrl || '');
    if (!m) return null;
    const f = m[1].toLowerCase();
    return f === 'jpg' ? 'JPEG' : f.toUpperCase();
}

export function buildPdf(state, JsPDF) {
    const doc = new JsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const accent = hexToRgb(state.branding && state.branding.primaryColor);
    const q = computeQuote(state);

    const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);
    const setText = (c) => doc.setTextColor(c[0], c[1], c[2]);
    const setDraw = (c) => doc.setDrawColor(c[0], c[1], c[2]);
    const A = [accent.r, accent.g, accent.b];

    let y = 0;

    const ensure = (need) => {
        if (y + need > CONTENT_BOTTOM) {
            doc.addPage();
            y = 22;
        }
    };

    /* ---------- HEADER ---------- */
    const meta = state.meta || {};
    const sender = state.sender || {};
    const client = state.client || {};

    // logo or sender name (left)
    let headerBottom = 16;
    let logoPlaced = false;
    if (state.branding && state.branding.logo) {
        const fmt = detectFormat(state.branding.logo);
        if (fmt) {
            try {
                const p = doc.getImageProperties(state.branding.logo);
                const ratio = p.width / p.height;
                let h = 16, w = h * ratio;
                if (w > 55) { w = 55; h = w / ratio; }
                doc.addImage(state.branding.logo, fmt, M, 14, w, h);
                headerBottom = Math.max(headerBottom, 14 + h);
                logoPlaced = true;
            } catch (e) { /* fall through to text */ }
        }
    }
    if (!logoPlaced && sender.company) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        setText(INK);
        doc.text(sender.company, M, 22);
        headerBottom = Math.max(headerBottom, 26);
    }

    // document title (right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    setText(A);
    doc.text((meta.title || 'OFFERTE').toUpperCase(), RIGHT, 22, { align: 'right' });

    // meta lines (right)
    let metaY = 31;
    const metaRow = (label, val) => {
        if (!val) return;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setText(FAINT);
        doc.text(label.toUpperCase(), COL.price, metaY, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        setText(INK);
        doc.text(String(val), RIGHT, metaY, { align: 'right' });
        metaY += 5.2;
    };
    metaRow('Nummer', meta.number);
    metaRow('Datum', meta.date);
    metaRow('Geldig tot', meta.validUntil);

    // accent rule under header
    y = Math.max(headerBottom, metaY) + 4;
    setFill(A);
    doc.rect(M, y, RIGHT - M, 1, 'F');
    y += 10;

    /* ---------- ADDRESSES ---------- */
    const colRX = M + (RIGHT - M) / 2 + 4;

    const addressBlock = (data, x, label) => {
        let cy = y;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        setText(FAINT);
        doc.text(label.toUpperCase(), x, cy);
        cy += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        setText(INK);
        if (data.company) { doc.text(data.company, x, cy); cy += 5; }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        setText(GRAY);
        if (data.contact) { doc.text('T.a.v. ' + data.contact, x, cy); cy += 4.6; }
        if (data.address) { doc.text(data.address, x, cy); cy += 4.6; }
        if (data.zip || data.city) { doc.text(`${data.zip || ''} ${data.city || ''}`.trim(), x, cy); cy += 4.6; }
        if (data.reference) { doc.text('Ref: ' + data.reference, x, cy); cy += 4.6; }
        return cy;
    };

    const fromY = addressBlock(sender, M, 'Van');
    const toY = addressBlock(client, colRX, 'Voor');
    y = Math.max(fromY, toY) + 6;

    // project line
    if (meta.project) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setText(FAINT);
        doc.text('BETREFT', M, y);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        setText(INK);
        doc.text(meta.project, M + 22, y);
        y += 8;
    }

    // separator
    setDraw(LINE);
    doc.setLineWidth(0.2);
    doc.line(M, y, RIGHT, y);
    y += 9;

    /* ---------- ITEM GROUPS ---------- */
    const tableHeader = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        setText(FAINT);
        doc.text('OMSCHRIJVING', M, y);
        doc.text('AANTAL', COL.qty, y, { align: 'right' });
        doc.text('PRIJS', COL.price, y, { align: 'right' });
        doc.text('BTW', COL.vat, y, { align: 'right' });
        doc.text('TOTAAL', COL.total, y, { align: 'right' });
        y += 2.5;
        setDraw(LINE);
        doc.setLineWidth(0.2);
        doc.line(M, y, RIGHT, y);
        y += 5;
    };

    q.activeGroups.forEach((group) => {
        ensure(20);
        // group header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        setText(A);
        doc.text(group.label, M, y);
        y += 6;

        tableHeader();

        group.items.forEach((item) => {
            const c = item._calc;
            // set the row font BEFORE wrapping so line breaks use the right size
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            const descLines = doc.splitTextToSize(item.description || '-', DESC_W);
            let rowH = Math.max(descLines.length * 4.4, 6);
            if (c.disc > 0) rowH += 4;
            const pBefore = doc.getNumberOfPages();
            ensure(rowH + 2);
            if (doc.getNumberOfPages() > pBefore) tableHeader(); // repeat header on new page

            const top = y;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5); // reset after a possible header redraw
            setText([51, 65, 85]);
            doc.text(descLines, M, y);
            doc.text(`${c.qty}${item.unit ? ' ' + item.unit : ''}`, COL.qty, y, { align: 'right' });
            doc.text(fmtEUR(c.price), COL.price, y, { align: 'right' });
            doc.text(`${c.vat}%`, COL.vat, y, { align: 'right' });
            doc.setFont('helvetica', 'bold');
            setText(INK);
            doc.text(fmtEUR(c.exVat), COL.total, y, { align: 'right' });

            let afterDesc = top + descLines.length * 4.4;
            if (c.disc > 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                setText([220, 38, 38]);
                doc.text(`Korting ${c.disc}%`, M, afterDesc);
                afterDesc += 4;
            }
            y = Math.max(afterDesc, top + 6) + 2;

            setDraw([241, 245, 249]);
            doc.setLineWidth(0.15);
            doc.line(M, y - 1.5, RIGHT, y - 1.5);
        });

        y += 3;

        if (group.key === 'one-off') {
            // totals box
            ensure(30);
            const lblX = 120;
            setDraw(INK);
            doc.setLineWidth(0.4);
            doc.line(lblX, y, RIGHT, y);
            y += 5.5;

            const totRow = (label, val, opts = {}) => {
                doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
                doc.setFontSize(opts.big ? 11.5 : 9.5);
                setText(opts.accent ? A : (opts.bold ? INK : GRAY));
                doc.text(label, lblX, y);
                doc.text(fmtEUR(val), RIGHT, y, { align: 'right' });
                y += opts.big ? 7 : 5.2;
            };

            totRow('Subtotaal (excl. btw)', q.grandSubtotal);
            Object.keys(q.vatBuckets)
                .sort((a, b) => Number(a) - Number(b))
                .forEach((rate) => {
                    if (q.vatBuckets[rate] !== 0) totRow(`btw ${rate}%`, q.vatBuckets[rate]);
                });
            y += 1.5;
            setDraw(LINE);
            doc.setLineWidth(0.2);
            doc.line(lblX, y - 3, RIGHT, y - 3);
            totRow('Totaal (incl. btw)', q.grandTotal, { bold: true, big: true, accent: true });
        } else {
            // recurring summary line
            ensure(10);
            setDraw(LINE);
            doc.setLineWidth(0.3);
            doc.line(100, y - 3, RIGHT, y - 3);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            setText(INK);
            const lbl = group.suffix ? `Totaal ${group.suffix} (excl. btw)` : `Totaal ${group.label.toLowerCase()} (excl. btw)`;
            doc.text(lbl, 100, y + 1.5);
            doc.text(fmtEUR(group.subtotal), RIGHT, y + 1.5, { align: 'right' });
            y += 9;
        }
        y += 4;
    });

    if (!q.hasItems) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        setText(FAINT);
        doc.text('Nog geen regels toegevoegd.', M, y);
        y += 8;
    }

    /* ---------- NOTES ---------- */
    if (state.notes) {
        const noteLines = doc.splitTextToSize(state.notes, RIGHT - M - 8);
        ensure(noteLines.length * 4.4 + 14);
        setFill([248, 250, 252]);
        const boxH = noteLines.length * 4.4 + 10;
        doc.roundedRect(M, y, RIGHT - M, boxH, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        setText(FAINT);
        doc.text('OPMERKINGEN', M + 4, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        setText(GRAY);
        doc.text(noteLines, M + 4, y + 11);
        y += boxH + 6;
    }

    /* ---------- SIGNATURES ---------- */
    if (!state.settings || state.settings.showSignature !== false) {
        ensure(34);
        y += 6;
        const colW = (RIGHT - M - 14) / 2;
        const leftX = M;
        const rightCol = M + colW + 14;
        const lineY = y + 16;

        // sender signature image
        if (state.signatureImage && detectFormat(state.signatureImage)) {
            try {
                const p = doc.getImageProperties(state.signatureImage);
                const ratio = p.width / p.height;
                let h = 13, w = h * ratio;
                if (w > colW) { w = colW; h = w / ratio; }
                doc.addImage(state.signatureImage, 'PNG', leftX, lineY - h, w, h);
            } catch (e) { /* ignore */ }
        }

        setDraw(LINE);
        doc.setLineWidth(0.3);
        doc.line(leftX, lineY, leftX + colW, lineY);
        doc.line(rightCol, lineY, rightCol + colW, lineY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        setText(GRAY);
        doc.text('Voor akkoord', leftX, lineY + 5);
        doc.text('Voor akkoord', rightCol, lineY + 5);

        doc.setFont('helvetica', 'bold');
        setText(INK);
        doc.text(sender.company || 'Opdrachtnemer', leftX, lineY + 9.5);
        doc.text(client.company || 'Opdrachtgever', rightCol, lineY + 9.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setText(FAINT);
        const today = meta.date || '';
        doc.text('Datum: ' + (today || '............'), leftX, lineY + 14);
        doc.text('Datum: ............', rightCol, lineY + 14);
        y = lineY + 18;
    }

    /* ---------- FOOTER on every page ---------- */
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        const fy = PAGE.h - 22;
        setDraw(A);
        doc.setLineWidth(0.6);
        doc.line(M, fy, RIGHT, fy);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        setText(GRAY);
        const lh = 3.5;
        const ty = fy + 4.8;

        // left: company / email / phone
        let ly = ty;
        if (sender.company) { doc.text(sender.company, M, ly); ly += lh; }
        if (sender.email) { doc.text(sender.email, M, ly); ly += lh; }
        if (sender.phone) { doc.text(sender.phone, M, ly); ly += lh; }

        // center: KVK / btw / IBAN
        let cy = ty;
        const cx = PAGE.w / 2;
        if (sender.kvk) { doc.text('KVK: ' + sender.kvk, cx, cy, { align: 'center' }); cy += lh; }
        if (sender.vat) { doc.text('btw: ' + sender.vat, cx, cy, { align: 'center' }); cy += lh; }
        if (sender.iban) { doc.text('IBAN: ' + sender.iban, cx, cy, { align: 'center' }); cy += lh; }

        // right: validity / website
        let ry = ty;
        doc.text('Geldig tot: ' + (meta.validUntil || '30 dagen na dagtekening'), RIGHT, ry, { align: 'right' }); ry += lh;
        if (sender.website) { doc.text(sender.website, RIGHT, ry, { align: 'right' }); ry += lh; }

        // bottom row: legal note + page number
        setText(FAINT);
        doc.setFontSize(7);
        doc.text('Op al onze diensten zijn de algemene voorwaarden van toepassing.', M, PAGE.h - 7);
        doc.text(`pagina ${i} / ${pages}`, RIGHT, PAGE.h - 7, { align: 'right' });
    }

    return doc;
}

const sanitize = (s) => String(s || '').replace(/[^\w\d\- ]+/g, '').trim();

export function pdfFilename(state) {
    const num = sanitize((state.meta && state.meta.number) || '');
    const client = sanitize((state.client && state.client.company) || 'Klant');
    return `Offerte ${num ? num + ' - ' : ''}${client || 'Klant'}.pdf`.replace(/\s+/g, ' ').trim();
}

// Browser entry point
export function generatePDF(state) {
    const { jsPDF } = window.jspdf;
    const doc = buildPdf(state, jsPDF);
    doc.save(pdfFilename(state));
}
