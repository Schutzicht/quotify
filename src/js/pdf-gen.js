export function generatePDF(state) {
    const { jsPDF } = window.jspdf;

    // Create new PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Helper: Add Logo
    // We would need to handle image data. State usually has base64.
    if (state.branding.logo) {
        // Add watermark
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.05 }));
        const imgProps = doc.getImageProperties(state.branding.logo);
        const ratio = imgProps.width / imgProps.height;
        const w = 150;
        const h = w / ratio;

        // Rotate logic in jsPDF is tricky without context, simplified centered
        doc.addImage(state.branding.logo, 'PNG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h, null, 'CENTER', 315); // rotated
        doc.restoreGraphicsState();

        // Add Header Logo
        doc.addImage(state.branding.logo, 'PNG', margin, 20, 30, 30 / ratio);
    } else {
        doc.setFontSize(20);
        doc.setTextColor(state.branding.primaryColor);
        doc.text("LOGO", margin, 35);
    }

    // Header Right
    doc.setFontSize(32);
    doc.setTextColor(state.branding.primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(state.meta.title || "OFFERTE", pageWidth - margin, 35, { align: "right" });

    // Header Meta
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");

    let metaY = 45;
    const rightX = pageWidth - margin;

    // Function to write meta line
    const writeMeta = (label, val) => {
        doc.text(label.toUpperCase(), rightX - 40, metaY);
        doc.setFont("helvetica", "bold");
        doc.text(val, rightX, metaY, { align: "right" });
        doc.setFont("helvetica", "normal");
        metaY += 5;
    };

    writeMeta("NUMMER", state.meta.number);
    writeMeta("DATUM", state.meta.date);
    if (state.meta.validUntil) writeMeta("GELDIG TOT", state.meta.validUntil);

    // Project Title
    if (state.meta.project) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(state.branding.primaryColor);
        doc.text(state.meta.project, margin, 60);
    }

    // Addresses
    let y = 80;

    // Helper to print address
    const printAddr = (data, x, title) => {
        let curY = y;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(title.toUpperCase(), x, curY);
        curY += 5;

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(data.company || "", x, curY);
        curY += 5;

        doc.setFont("helvetica", "normal");
        if (data.contact) { doc.text(`T.a.v. ${data.contact}`, x, curY); curY += 5; }
        if (data.address) { doc.text(data.address, x, curY); curY += 5; }
        if (data.zip || data.city) { doc.text(`${data.zip} ${data.city}`, x, curY); curY += 5; }
        if (data.country) { doc.text(data.country, x, curY); curY += 5; }
    };

    printAddr(state.sender, margin, "VAN");
    printAddr(state.client, pageWidth / 2 + 10, "VOOR");

    // Items
    y += 40;

    // Simple table generator for jsPDF
    const headers = [["OMSCHRIJVING", "AANTAL", "PRIJS", "TOTAAL"]];

    // We need to flatten items or group them. Let's group.
    const groups = {
        'one-off': { label: 'Eenmalige Investering', items: [] },
        'start': { label: 'Opstartkosten', items: [] },
        'monthly': { label: 'Maandelijkse Kosten', items: [] },
        'yearly': { label: 'Jaarlijkse Kosten', items: [] }
    };

    state.items.forEach(i => {
        const pd = i.period || 'one-off';
        if (groups[pd]) groups[pd].items.push(i);
        else groups['one-off'].items.push(i); // Fallback
    });

    Object.keys(groups).forEach(key => {
        const group = groups[key];
        if (group.items.length === 0) return;

        // Group Header
        doc.setFontSize(11);
        doc.setTextColor(state.branding.primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(group.label, margin, y);
        y += 7;

        // Draw Table items manual or use allow-auto-table logic? 
        // For robustness without plugin, let's manual draw lines.
        doc.setDrawColor(230);
        doc.line(margin, y, pageWidth - margin, y); // Header line
        y += 7;

        // Values
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.setFont("helvetica", "normal");

        let subtotal = 0;

        group.items.forEach(item => {
            const lineTotal = item.price * item.quantity;
            subtotal += lineTotal;

            doc.text(item.description + (item.unit ? ` (${item.unit})` : ""), margin, y);
            doc.text(item.quantity.toString(), pageWidth - 80, y, { align: "right" });
            doc.text(`€ ${item.price.toFixed(2)}`, pageWidth - 50, y, { align: "right" });
            doc.text(`€ ${lineTotal.toFixed(2)}`, pageWidth - margin, y, { align: "right" });

            y += 8;
        });

        // Group Total
        doc.setFont("helvetica", "bold");
        doc.text(`Totaal ${group.label}`, pageWidth - 80, y, { align: "right" });
        doc.text(`€ ${subtotal.toFixed(2)}`, pageWidth - margin, y, { align: "right" });
        y += 15;
    });

    // Notes
    if (state.notes) {
        y += 10;
        doc.setFontSize(9);
        doc.setTextColor(100);
        const splitNotes = doc.splitTextToSize(state.notes, pageWidth - (margin * 2));
        doc.text(splitNotes, margin, y);
        y += (splitNotes.length * 5) + 10;
    }

    // Footer
    const footerY = pageHeight - 30;
    doc.setDrawColor(state.branding.primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFontSize(8);
    doc.setTextColor(100);

    // 3 cols
    doc.text(state.sender.company || "", margin, footerY + 8);
    doc.text(state.sender.email || "", margin, footerY + 13);

    doc.text(`KVK: ${state.sender.kvk || "-"}`, pageWidth / 2, footerY + 8, { align: "center" });
    doc.text(`IBAN: ${state.sender.iban || "-"}`, pageWidth / 2, footerY + 13, { align: "center" });

    doc.text("Geldig tot: " + (state.meta.validUntil || "-"), pageWidth - margin, footerY + 8, { align: "right" });

    doc.save(`${state.meta.title}_${state.meta.number}.pdf`);
}
