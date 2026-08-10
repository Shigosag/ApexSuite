const PDFDocument = require('pdfkit');

function generateInvoicePDF(orderData, invoiceData, res) {
  try {
    const doc = new PDFDocument({ margin: 40 });

    doc.on('error', (err) => {
      console.error('PDFKit Document Error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'PDF Generation Failed: ' + err.message });
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice_${invoiceData.invoice_number || 'Receipt'}.pdf`);

    doc.pipe(res);

    // Header & Branding
    doc.fillColor('#f34b7d').fontSize(24).text('APEXSUITE ENTERPRISE', { align: 'right' });
    doc.fillColor('#64748b').fontSize(10).text('Powered by Shigosag Systems', { align: 'right' });
    doc.moveDown(1.5);

    // Invoice Metadata
    doc.fillColor('#0f172a').fontSize(16).text(`OFFICIAL INVOICE: ${invoiceData.invoice_number || 'INV-' + orderData.id}`);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Order Number: ${orderData.order_number || 'N/A'}`);
    doc.text(`Issued Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Due Date: ${invoiceData.due_date || 'Due Upon Receipt'}`);
    doc.text(`Payment Status: ${(invoiceData.status || 'Paid').toUpperCase()}`);
    doc.moveDown(1);

    // Table Divider
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(0.5);

    // Table Headers
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold');
    doc.text('SKU / Code', 40, doc.y, { width: 100 });
    doc.text('Product Description', 140, doc.y - 12, { width: 220 });
    doc.text('Qty', 360, doc.y - 12, { width: 40, align: 'right' });
    doc.text('Unit Price', 410, doc.y - 12, { width: 70, align: 'right' });
    doc.text('Subtotal', 490, doc.y - 12, { width: 80, align: 'right' });
    doc.moveDown(0.5);

    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(0.5);

    // Items Iteration
    doc.font('Helvetica').fontSize(9).fillColor('#334155');
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach(item => {
        const yPos = doc.y;
        const qty = String(item.quantity || 1);
        const unitPrice = parseFloat(item.unit_price || 0).toFixed(2);
        const subtotal = parseFloat(item.subtotal || 0).toFixed(2);

        doc.text(item.sku || 'N/A', 40, yPos, { width: 100 });
        doc.text(item.name || 'Item', 140, yPos, { width: 220 });
        doc.text(qty, 360, yPos, { width: 40, align: 'right' });
        doc.text(`$${unitPrice}`, 410, yPos, { width: 70, align: 'right' });
        doc.text(`$${subtotal}`, 490, yPos, { width: 80, align: 'right' });
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(1);
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(1);

    // Financial Breakdown Summary
    const summaryY = doc.y;
    const taxAmount = parseFloat(orderData.tax_amount || 0).toFixed(2);
    const totalAmount = parseFloat(invoiceData.amount_due || orderData.total_amount || 0).toFixed(2);

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a');
    doc.text('Tax (7%):', 350, summaryY, { width: 120, align: 'right' });
    doc.text(`$${taxAmount}`, 480, summaryY, { width: 90, align: 'right' });

    doc.text('Total Amount Due:', 350, summaryY + 18, { width: 120, align: 'right' });
    doc.fillColor('#f34b7d').text(`$${totalAmount}`, 480, summaryY + 18, { width: 90, align: 'right' });

    doc.moveDown(3);
    doc.fontSize(9).fillColor('#94a3b8').font('Helvetica-Oblique').text('Thank you for choosing ApexSuite Enterprise Solutions.', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF Generation exception:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'PDF Generation Error: ' + err.message });
    }
  }
}

module.exports = {
  generateInvoicePDF
};