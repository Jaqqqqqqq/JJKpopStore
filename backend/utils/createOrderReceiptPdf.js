function escapePdfText(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(value, maxLength = 40) {
  const words = String(value ?? "").split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function createOrderReceiptPdf(order) {
  const customer = order.user || {};
  const money = (amount) => `PHP ${Number(amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pages = [];
  let commands;
  let y;

  const color = (rgb) => rgb.map((value) => value.toFixed(3)).join(" ");
  const rectangle = (x, bottom, width, height, rgb) =>
    commands.push(`${color(rgb)} rg ${x} ${bottom} ${width} ${height} re f`);
  const line = (x1, y1, x2, y2, rgb, width = 1) =>
    commands.push(`${color(rgb)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  const text = (x, baseline, value, size = 10, bold = false, rgb = [0.20, 0.13, 0.20]) =>
    commands.push(`${color(rgb)} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${baseline} Td (${escapePdfText(value)}) Tj ET`);
  const rightText = (right, baseline, value, size = 9, bold = false, rgb = [0.20, 0.13, 0.20]) => {
    const safeValue = escapePdfText(value);
    const approximateWidth = safeValue.length * size * (bold ? 0.56 : 0.52);
    commands.push(`${color(rgb)} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${Math.max(42, right - approximateWidth)} ${baseline} Td (${safeValue}) Tj ET`);
  };

  function addFooter(pageNumber) {
    line(40, 54, 572, 54, [0.91, 0.83, 0.88], 0.7);
    text(42, 36, "J&J K-POP STORE  |  Thank you for your order!", 8, false, [0.48, 0.39, 0.49]);
    rightText(570, 36, `Page ${pageNumber}`, 8, false, [0.48, 0.39, 0.49]);
  }

  function addHeader(continuation = false) {
    if (commands) {
      addFooter(pages.length + 1);
      pages.push(commands.join("\n"));
    }

    commands = [];
    rectangle(0, 700, 612, 92, [0.20, 0.11, 0.20]);
    rectangle(0, 700, 612, 5, [0.93, 0.34, 0.57]);
    text(42, 752, "J&J K-POP", 23, true, [1.00, 1.00, 1.00]);
    text(43, 733, "MERCHANDISE STORE", 8, true, [0.98, 0.77, 0.86]);
    rightText(570, 752, continuation ? "RECEIPT - CONTINUED" : "TRANSACTION RECEIPT", 10, true, [1.00, 0.85, 0.92]);

    if (!continuation) {
      rectangle(40, 602, 532, 78, [0.99, 0.96, 0.98]);
      text(54, 660, "ORDER DETAILS", 8, true, [0.72, 0.25, 0.43]);
      text(54, 642, `Order #${String(order._id).slice(-8).toUpperCase()}`, 11, true);
      rightText(558, 642, new Date(order.createdAt || Date.now()).toLocaleString("en-PH", { timeZone: "Asia/Manila" }), 8, false, [0.39, 0.31, 0.40]);
      text(54, 623, `Customer: ${customer.name || "Customer"}`, 8, false);
      rightText(558, 623, `Email: ${customer.email || "Not available"}`, 8, false, [0.39, 0.31, 0.40]);
      const status = `Status: ${order.orderStatus}`;
      text(54, 608, status, 8, true, [0.72, 0.25, 0.43]);
      text(278, 608, `Payment: ${order.paymentMethod || "Not specified"}`, 8, false, [0.39, 0.31, 0.40]);
      if (order.paymentAmount) {
        rightText(558, 608, `E-wallet paid: ${money(order.paymentAmount)}`, 8, true, [0.39, 0.31, 0.40]);
      }
      y = 570;
    } else {
      y = 670;
    }

    text(42, y, "PRODUCTS / SERVICES", 11, true, [0.20, 0.11, 0.20]);
    y -= 18;
    rectangle(40, y - 5, 532, 23, [0.99, 0.94, 0.97]);
    text(50, y + 2, "ITEM", 7, true, [0.58, 0.31, 0.43]);
    text(357, y + 2, "QTY", 7, true, [0.58, 0.31, 0.43]);
    rightText(465, y + 2, "UNIT PRICE", 7, true, [0.58, 0.31, 0.43]);
    rightText(561, y + 2, "SUBTOTAL", 7, true, [0.58, 0.31, 0.43]);
    y -= 23;
  }

  addHeader();
  (order.orderItems || []).forEach((item) => {
    const nameLines = wrapText(item.name, 42);
    const rowHeight = Math.max(31, nameLines.length * 11 + 12);
    if (y - rowHeight < 115) addHeader(true);

    const firstLineY = y - (rowHeight - nameLines.length * 11) / 2 - 8;
    nameLines.forEach((nameLine, index) => {
      text(50, firstLineY - index * 11, nameLine, 8, index === 0);
    });
    text(359, y - rowHeight / 2 - 2, String(item.quantity), 8, false, [0.39, 0.31, 0.40]);
    rightText(465, y - rowHeight / 2 - 2, money(item.price), 8, false, [0.39, 0.31, 0.40]);
    rightText(561, y - rowHeight / 2 - 2, money(Number(item.price) * Number(item.quantity)), 8, true);
    line(48, y - rowHeight, 564, y - rowHeight, [0.93, 0.88, 0.91], 0.5);
    y -= rowHeight;
  });

  if (y < 200) addHeader(true);
  const summaryTop = y - 18;
  text(326, summaryTop, "Subtotal", 9, false, [0.39, 0.31, 0.40]);
  rightText(560, summaryTop, money(order.itemsPrice), 9, true);
  text(326, summaryTop - 19, "Tax", 9, false, [0.39, 0.31, 0.40]);
  rightText(560, summaryTop - 19, money(order.taxPrice), 9, false, [0.39, 0.31, 0.40]);
  text(326, summaryTop - 38, "Shipping", 9, false, [0.39, 0.31, 0.40]);
  rightText(560, summaryTop - 38, money(order.shippingPrice), 9, false, [0.39, 0.31, 0.40]);
  rectangle(312, summaryTop - 77, 260, 29, [0.87, 0.25, 0.50]);
  text(324, summaryTop - 67, "GRAND TOTAL", 9, true, [1.00, 1.00, 1.00]);
  rightText(560, summaryTop - 67, money(order.totalPrice), 10, true, [1.00, 1.00, 1.00]);

  text(42, Math.max(88, summaryTop - 104), "Keep this receipt for your transaction records.", 8, false, [0.48, 0.39, 0.49]);
  addFooter(pages.length + 1);
  pages.push(commands.join("\n"));

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  const pageRefs = [];
  pages.forEach((stream, pageIndex) => {
    const pageId = 5 + pageIndex * 2;
    const contentId = pageId + 1;
    pageRefs.push(`${pageId} 0 R`);
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, "ascii");
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
}

module.exports = createOrderReceiptPdf;
