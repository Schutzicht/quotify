/* ===========================================================
   Offertje - shared quote calculation (single source of truth)
   Used by BOTH the live preview (main.js) and the PDF (pdf-gen.js)
   so the downloaded PDF always matches what the user sees.
   =========================================================== */

// Dutch currency: "€ 2.500,00"
export const fmtEUR = (n) =>
    '€ ' + (Number(n) || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Plain number "2.500,00" (no symbol)
export const fmtNum = (n) =>
    (Number(n) || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Period -> human label + recurring suffix
export const GROUP_DEFS = [
    { key: 'one-off', label: 'Eenmalige investering', suffix: '' },
    { key: 'start', label: 'Opstartkosten', suffix: '' },
    { key: 'weekly', label: 'Wekelijkse kosten', suffix: 'per week' },
    { key: 'monthly', label: 'Maandelijkse kosten', suffix: 'per maand' },
    { key: 'quarterly', label: 'Kosten per kwartaal', suffix: 'per kwartaal' },
    { key: 'yearly', label: 'Jaarlijkse kosten', suffix: 'per jaar' },
];

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Compute every figure for a quote from state.items.
 * Returns grouped items (with per-line calc), VAT buckets and totals.
 */
export function computeQuote(state) {
    const groups = {};
    GROUP_DEFS.forEach((g) => {
        groups[g.key] = { ...g, items: [], subtotal: 0, vatTotal: 0 };
    });

    const vatBuckets = {}; // one-off VAT split per rate

    (state.items || []).forEach((item) => {
        const periodKey = groups[item.period] ? item.period : 'one-off';
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const disc = Number(item.discount) || 0;
        const vat = Number(item.vat) || 0;

        const raw = price * qty;
        const discAmount = raw * (disc / 100);
        const exVat = raw - discAmount;
        const vatAmount = exVat * (vat / 100);

        const calc = {
            qty, price, disc, vat,
            raw: round2(raw),
            discAmount: round2(discAmount),
            exVat: round2(exVat),
            vatAmount: round2(vatAmount),
            incl: round2(exVat + vatAmount),
        };

        const g = groups[periodKey];
        g.items.push({ ...item, _calc: calc });
        g.subtotal += exVat;
        g.vatTotal += vatAmount;

        if (periodKey === 'one-off') {
            vatBuckets[vat] = (vatBuckets[vat] || 0) + vatAmount;
        }
    });

    // round group totals
    Object.values(groups).forEach((g) => {
        g.subtotal = round2(g.subtotal);
        g.vatTotal = round2(g.vatTotal);
        g.totalIncl = round2(g.subtotal + g.vatTotal);
    });
    Object.keys(vatBuckets).forEach((k) => (vatBuckets[k] = round2(vatBuckets[k])));

    const ordered = GROUP_DEFS.map((d) => groups[d.key]);
    const activeGroups = ordered.filter((g) => g.items.length > 0);
    const oneOff = groups['one-off'];
    const recurringGroups = activeGroups.filter((g) => g.key !== 'one-off');

    return {
        groups,
        activeGroups,
        oneOff,
        recurringGroups,
        vatBuckets,
        grandSubtotal: oneOff.subtotal,
        grandVat: oneOff.vatTotal,
        grandTotal: oneOff.totalIncl,
        hasItems: activeGroups.length > 0,
    };
}

// hex (#RRGGBB / #RGB) -> {r,g,b}
export function hexToRgb(hex) {
    let h = String(hex || '#0f172a').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const int = parseInt(h, 16);
    if (Number.isNaN(int) || h.length !== 6) return { r: 15, g: 23, b: 42 };
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}
