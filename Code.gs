const HEADERS = [
  'Timestamp',
  'Nombre',
  'Teléfono',
  'Correo electrónico',
  'Tipo de evento',
  'Fecha del evento',
  'Ubicación',
  'Horas de música',
  'Mensaje'
];

function doPost(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};

    if (params.company) {
      return jsonResponse({ success: true });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    const lock = LockService.getDocumentLock();
    lock.waitLock(10000);

    try {
      const headers = ensureHeaders(sheet);
      const valuesByHeader = {
        'Timestamp': new Date(),
        'Nombre': safeCell(params.name),
        'Teléfono': safeCell(params.phone),
        'Correo electrónico': safeCell(params.email),
        'Tipo de evento': safeCell(params.eventType),
        'Fecha del evento': safeCell(params.eventDate),
        'Ubicación': safeCell(params.location),
        'Horas de música': safeCell(params.musicHours),
        'Mensaje': safeCell(params.message)
      };

      const row = headers.map((header) => (
        Object.prototype.hasOwnProperty.call(valuesByHeader, header)
          ? valuesByHeader[header]
          : ''
      ));

      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, error: 'No se pudo guardar la solicitud.' });
  }
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return HEADERS.slice();
  }

  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map((value) => String(value).trim());

  HEADERS.forEach((header) => {
    if (!headers.includes(header)) {
      headers.push(header);
      sheet.getRange(1, headers.length).setValue(header).setFontWeight('bold');
    }
  });

  return headers;
}

function safeCell(value) {
  const text = value == null ? '' : String(value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
