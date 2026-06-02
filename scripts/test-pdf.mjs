/* Headless test harness for the PDF generator.
   Generates sample offertes to /tmp so the output can be inspected.
   Run: node scripts/test-pdf.mjs */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { jsPDF } from 'jspdf';
import { buildPdf } from '../src/js/pdf-gen.js';

const dataUrl = (p, mime = 'image/png') =>
    existsSync(p) ? `data:${mime};base64,` + readFileSync(p).toString('base64') : null;

const logo = dataUrl('/tmp/offertje-logo.png');
const sig = dataUrl('/tmp/offertje-sig.png');

const sender = {
    company: 'Jansen Webdesign', contact: 'Jorik Jansen', address: 'Hoofdstraat 12',
    zip: '4331 AB', city: 'Middelburg', country: 'Nederland',
    email: 'info@jansenwebdesign.nl', phone: '06 12 34 56 78', website: 'www.jansenwebdesign.nl',
    kvk: '12345678', vat: 'NL0012.34.567.B01', iban: 'NL00 BANK 0123 4567 89',
};
const client = {
    company: 'Bakkerij De Korenbloem', contact: 'mevr. De Vries', address: 'Marktplein 5',
    zip: '4357 BC', city: 'Domburg', country: 'Nederland', reference: 'PO-2026-88',
};

const gen = (state, file) => {
    const doc = buildPdf(state, jsPDF);
    const buf = Buffer.from(doc.output('arraybuffer'));
    writeFileSync(file, buf);
    console.log(`wrote ${file}  ${buf.length} bytes  ${doc.getNumberOfPages()} page(s)`);
};

// 1. Complex: logo, multi-VAT, discount, recurring, notes, signature
gen({
    branding: { logo, primaryColor: '#6366F1' },
    sender, client,
    meta: { number: 'OFF-2026-014', date: '02-06-2026', validUntil: '30-06-2026', title: 'OFFERTE', project: 'Nieuwe website plus onderhoud' },
    settings: { showSignature: true },
    signatureImage: sig,
    notes: 'Levering in overleg. Betaling 30 procent bij akkoord, 70 procent bij oplevering. Op alle opdrachten zijn onze algemene voorwaarden van toepassing.',
    items: [
        { description: 'Ontwerp homepage en huisstijl', price: 750, quantity: 1, unit: '', vat: 21, discount: 0, period: 'one-off' },
        { description: 'Bouw website (5 pagina\'s) inclusief CMS-koppeling en volledig responsive opmaak voor mobiel en tablet', price: 950, quantity: 1, unit: '', vat: 21, discount: 10, period: 'one-off' },
        { description: 'Contentmigratie en teksten plaatsen', price: 65, quantity: 4, unit: 'uur', vat: 21, discount: 0, period: 'one-off' },
        { description: 'Drukwerk visitekaartjes', price: 90, quantity: 1, unit: '', vat: 9, discount: 0, period: 'one-off' },
        { description: 'Hosting en onderhoud', price: 25, quantity: 1, unit: '', vat: 21, discount: 0, period: 'monthly' },
    ],
}, '/tmp/offertje-complex.pdf');

// 2. Long: pagination test
gen({
    branding: { logo: null, primaryColor: '#059669' },
    sender, client,
    meta: { number: 'OFF-2026-099', date: '02-06-2026', validUntil: '30-06-2026', title: 'OFFERTE', project: 'Groot project' },
    settings: { showSignature: true },
    notes: 'Dit is een lange offerte om paginering te testen.',
    items: Array.from({ length: 30 }, (_, i) => ({
        description: `Werkzaamheid regel ${i + 1} met een wat langere omschrijving om de word-wrap binnen de kolom te testen`,
        price: 100 + i, quantity: (i % 3) + 1, unit: 'stk', vat: i % 2 ? 21 : 9, discount: i % 5 ? 0 : 15, period: 'one-off',
    })),
}, '/tmp/offertje-long.pdf');

// 3. Minimal
gen({
    branding: { primaryColor: '#DC2626' },
    sender: { company: 'ZZP Klusbedrijf', email: 'klus@voorbeeld.nl', phone: '06 00 00 00 00' },
    client: { company: 'Klant BV' },
    meta: { number: '2026-001', date: '02-06-2026', title: 'OFFERTE' },
    settings: { showSignature: true },
    items: [{ description: 'Advies en voorbereiding', price: 80, quantity: 2, unit: 'uur', vat: 21, discount: 0, period: 'one-off' }],
}, '/tmp/offertje-minimal.pdf');

console.log('done');
