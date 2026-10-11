// =========================================================
// ContractHub — Contract PDF generator
// Renders a professional, print-ready contract PDF entirely
// client-side using jsPDF + jspdf-autotable. Nothing leaves
// the browser.
// =========================================================

const ContractPDF = (() => {

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 16;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const INK = [20, 22, 31];
  const INK_SOFT = [90, 95, 110];
  const INK_FAINT = [140, 145, 160];
  const PRIMARY = [62, 107, 255];
  const LINE = [225, 228, 238];
  const PANEL = [246, 248, 253];

  function money(amount, currency) {
    const n = Number(amount) || 0;
    return `${currency || 'PKR'} ${n.toLocaleString('en-US')}`;
  }

  function dateStr(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async function generate(contract, client, settings) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = MARGIN;

    y = drawHeader(doc, contract, settings, y);
    y = drawParties(doc, contract, client, settings, y);
    y = drawScope(doc, contract, y);
    y = drawCommercialTerms(doc, contract, y);

    if (contract.paymentType === 'installments' && contract.paymentSchedule && contract.paymentSchedule.length) {
      y = drawPaymentSchedule(doc, contract, y);
    }

    y = drawTerms(doc, contract, settings, y);
    y = drawSignatures(doc, contract, client, settings, y);

    paginate(doc, contract, settings);

    const safeName = (client && client.companyName ? client.companyName : 'client').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const filename = `${contract.contractNumber || 'contract'}-${safeName}.pdf`;
    doc.save(filename);
    return filename;
  }

  // ---------- Layout helpers ----------

  function ensureSpace(doc, y, needed) {
    if (y + needed > PAGE_H - MARGIN - 12) {
      doc.addPage();
      return MARGIN;
    }
    return y;
  }

  function sectionTitle(doc, text, y) {
    y = ensureSpace(doc, y, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(text.toUpperCase(), MARGIN, y);
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y + 1.6, MARGIN + 10, y + 1.6);
    return y + 8;
  }

  function paragraph(doc, text, y, opts = {}) {
    const size = opts.size || 9.5;
    const color = opts.color || INK_SOFT;
    const lineHeight = opts.lineHeight || 4.6;
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, opts.width || CONTENT_W);
    for (const line of lines) {
      y = ensureSpace(doc, y, lineHeight + 2);
      doc.text(line, opts.x || MARGIN, y);
      y += lineHeight;
    }
    return y;
  }

  // ---------- Sections ----------

  function drawHeader(doc, contract, settings, y) {
    const logoSize = 18;
    let textX = MARGIN;

    if (settings.companyLogo) {
      try {
        doc.addImage(settings.companyLogo, 'PNG', MARGIN, y - 2, logoSize, logoSize, undefined, 'FAST');
        textX = MARGIN + logoSize + 5;
      } catch (e) { /* ignore bad image */ }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...INK);
    doc.text(settings.companyName || 'Your Company', textX, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK_FAINT);
    const contactLine = [settings.companyAddress, settings.companyPhone, settings.companyEmail].filter(Boolean).join('  ·  ');
    if (contactLine) doc.text(doc.splitTextToSize(contactLine, 105), textX, y + 10.5);

    // Right-aligned title block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...PRIMARY);
    doc.text('SOFTWARE AGREEMENT', PAGE_W - MARGIN, y + 4, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK_SOFT);
    doc.text(`Contract No: ${contract.contractNumber || '—'}`, PAGE_W - MARGIN, y + 10, { align: 'right' });
    doc.text(`Date: ${dateStr(contract.createdAt || Date.now())}`, PAGE_W - MARGIN, y + 14.5, { align: 'right' });

    y += 22;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    return y + 8;
  }

  function drawParties(doc, contract, client, settings, y) {
    y = sectionTitle(doc, 'Parties to this Agreement', y);
    const colW = (CONTENT_W - 8) / 2;
    const startY = y;

    // Provider box
    drawPanel(doc, MARGIN, y, colW, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK_FAINT);
    doc.text('SERVICE PROVIDER', MARGIN + 5, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(settings.companyName || '—', MARGIN + 5, y + 12.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.7);
    doc.setTextColor(...INK_SOFT);
    let py = y + 17.5;
    [settings.companyAddress, settings.companyPhone, settings.companyEmail].filter(Boolean).forEach(line => {
      const wrapped = doc.splitTextToSize(line, colW - 10);
      wrapped.forEach(l => { doc.text(l, MARGIN + 5, py); py += 4; });
    });

    // Client box
    const cx = MARGIN + colW + 8;
    drawPanel(doc, cx, y, colW, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK_FAINT);
    doc.text('CLIENT', cx + 5, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text((client && client.companyName) || '—', cx + 5, y + 12.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.7);
    doc.setTextColor(...INK_SOFT);
    let cy = y + 17.5;
    const clientLines = client ? [
      client.contactPerson,
      [client.address, client.city].filter(Boolean).join(', '),
      client.phone,
      client.email
    ].filter(Boolean) : [];
    clientLines.forEach(line => {
      const wrapped = doc.splitTextToSize(line, colW - 10);
      wrapped.forEach(l => { doc.text(l, cx + 5, cy); cy += 4; });
    });

    return startY + 38;
  }

  function drawPanel(doc, x, y, w, h) {
    doc.setFillColor(...PANEL);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  }

  function drawScope(doc, contract, y) {
    y = sectionTitle(doc, 'Scope of Work', y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    y = ensureSpace(doc, y, 6);
    doc.text(contract.softwareName || contract.title || 'Software Development', MARGIN, y);
    y += 6;
    if (contract.scopeDescription) {
      y = paragraph(doc, contract.scopeDescription, y);
    }
    return y + 4;
  }

  function drawCommercialTerms(doc, contract, y) {
    y = sectionTitle(doc, 'Commercial Terms', y);
    const rows = [
      ['Total Contract Value', money(contract.amount, contract.currency)],
      ['Payment Type', contract.paymentType === 'installments' ? 'Installments' : 'Full Payment'],
      ['Start Date', dateStr(contract.startDate)],
      ['Delivery Date', dateStr(contract.deliveryDate)],
      ['Support / Warranty Period', `${contract.supportPeriodMonths || 0} month(s)`]
    ];
    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      body: rows,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9.5, cellPadding: { top: 2.2, bottom: 2.2, left: 0, right: 4 }, textColor: INK_SOFT },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: INK, cellWidth: 60 },
        1: { textColor: INK_SOFT }
      },
      didParseCell: (data) => {
        if (data.row.index < rows.length - 1) {
          data.cell.styles.lineWidth = { bottom: 0.15 };
          data.cell.styles.lineColor = LINE;
        }
      }
    });
    return doc.lastAutoTable.finalY + 8;
  }

  function drawPaymentSchedule(doc, contract, y) {
    y = sectionTitle(doc, 'Payment Schedule', y);
    const body = contract.paymentSchedule.map(p => [
      p.label || 'Installment', dateStr(p.dueDate), money(p.amount, contract.currency)
    ]);
    const total = contract.paymentSchedule.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    body.push(['Total', '', money(total, contract.currency)]);

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Installment', 'Due Date', 'Amount']],
      body,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3.2, textColor: INK_SOFT, lineColor: LINE, lineWidth: 0.2 },
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      columnStyles: { 2: { halign: 'right' } },
      didParseCell: (data) => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = INK;
          data.cell.styles.fillColor = PANEL;
        }
      }
    });
    return doc.lastAutoTable.finalY + 8;
  }

  function drawTerms(doc, contract, settings, y) {
    y = sectionTitle(doc, 'Terms & Conditions', y);
    const text = contract.termsAndConditions || settings.defaultTerms || '';
    const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    for (const block of blocks) {
      y = paragraph(doc, block, y, { size: 8.8, lineHeight: 4.1 });
      y += 3;
    }
    return y + 2;
  }

  function drawSignatures(doc, contract, client, settings, y) {
    y = ensureSpace(doc, y, 46);
    y = sectionTitle(doc, 'Acceptance', y);
    y = paragraph(doc, 'By signing below, both parties acknowledge that they have read, understood and agree to be bound by the terms of this Agreement.', y, { size: 9 });
    y += 8;
    y = ensureSpace(doc, y, 34);

    const colW = (CONTENT_W - 16) / 2;
    const boxY = y;

    signatureBlock(doc, MARGIN, boxY, colW, `For ${settings.companyName || 'Service Provider'}`);
    signatureBlock(doc, MARGIN + colW + 16, boxY, colW, `For ${(client && client.companyName) || 'Client'}`);

    return boxY + 34;
  }

  function signatureBlock(doc, x, y, w, label) {
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(x, y + 16, x + w, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    doc.setTextColor(...INK_FAINT);
    doc.text('Signature', x, y + 20.5);

    doc.line(x, y + 30, x + w * 0.55, y + 30);
    doc.text('Date', x, y + 34.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...INK_SOFT);
    doc.text(label, x, y - 1);
  }

  function paginate(doc, contract, settings) {
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...INK_FAINT);
      doc.text(`${contract.contractNumber || ''}`.trim(), MARGIN, PAGE_H - 9);
      doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, PAGE_H - 9, { align: 'right' });
      doc.text(`${settings.companyName || ''}`, PAGE_W / 2, PAGE_H - 9, { align: 'center' });
    }
  }

  return { generate };
})();
