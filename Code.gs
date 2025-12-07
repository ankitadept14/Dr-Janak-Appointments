// Google Apps Script Backend for Dr. Janak Appointment System
// Deploy as Web App with "Execute as: Me" and "Who has access: Anyone"
// IMPORTANT: This script must be bound to the spreadsheet (Extensions > Apps Script from within the sheet)

const APPOINTMENTS_SHEET = 'Appointments';
const CONFIG_SHEET = 'Config';

/**
 * Handle GET requests - Fetch appointments
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(APPOINTMENTS_SHEET);
    
    if (!sheet) {
      return createResponse({ error: 'Appointments sheet not found' }, e);
    }

    // Support action routing via GET to avoid CORS preflight (create/update/delete)
    const action = (e.parameter.action || '').toLowerCase();
    if (action === 'create') {
      const data = {
        patientName: e.parameter.patientName || '',
        phone: e.parameter.phone || '',
        date: e.parameter.date || '',
        time: e.parameter.time || '',
        status: e.parameter.status || 'Scheduled',
        notes: e.parameter.notes || ''
      };
      return createAppointment(data, e);
    }
    if (action === 'update') {
      const data = {
        id: e.parameter.id || '',
        status: e.parameter.status,
        notes: e.parameter.notes
      };
      return updateAppointment(data, e);
    }
    if (action === 'delete') {
      const data = {
        id: e.parameter.id || ''
      };
      return deleteAppointment(data, e);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Convert to array of objects
    const appointments = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    }).filter(apt => apt.id); // Filter out empty rows
    
    // Optional filtering by date
    const filterDate = e.parameter.date;
    if (filterDate) {
      const filtered = appointments.filter(apt => apt.date === filterDate);
      return createResponse({ success: true, appointments: filtered }, e);
    }
    
    return createResponse({ success: true, appointments }, e);
  } catch (error) {
    return createResponse({ error: error.toString() }, e);
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}

/**
 * Handle POST requests - Create, Update, or Delete appointments
 */
function doPost(e) {
  try {
    // Prefer form parameters to avoid JSON parsing errors
    const data = e && e.parameter ? e.parameter : {};
    const action = (data.action || 'create').toLowerCase();
    
    switch (action) {
      case 'create':
        return createAppointment(data, e);
      case 'update':
        return updateAppointment(data, e);
      case 'delete':
        return deleteAppointment(data, e);
      default:
        return createResponse({ error: 'Invalid action' }, e);
    }
  } catch (error) {
    // Fallback to JSON parse if parameter parsing fails
    try {
      const parsed = JSON.parse(e.postData.contents);
      const action2 = (parsed.action || 'create').toLowerCase();
      switch (action2) {
        case 'create':
          return createAppointment(parsed, e);
        case 'update':
          return updateAppointment(parsed, e);
        case 'delete':
          return deleteAppointment(parsed, e);
      }
    } catch (err) {}
    return createResponse({ error: error.toString() }, e);
  }
}

/**
 * Create a new appointment
 */
function createAppointment(data, e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APPOINTMENTS_SHEET);
  
  if (!sheet) {
    return createResponse({ error: 'Appointments sheet not found' }, e);
  }
  
  // Check if phone number exists to determine type
  const existingData = sheet.getDataRange().getValues();
  const phoneColumn = existingData[0].indexOf('phone');
  const existingPhones = existingData.slice(1).map(row => row[phoneColumn]);
  
  const type = existingPhones.includes(data.phone) ? 'Old' : 'New';
  
  // Generate new ID
  const lastRow = sheet.getLastRow();
  const newId = lastRow > 1 ? 
    Math.max(...existingData.slice(1).map(row => parseInt(row[0]) || 0)) + 1 : 1;
  
  // Create new appointment row
  const timestamp = new Date().toISOString();
  const newRow = [
    newId,
    timestamp,
    data.patientName || '',
    data.phone || '',
    data.date || '',
    data.time || '',
    type,
    data.status || 'Scheduled',
    data.notes || ''
  ];
  
  sheet.appendRow(newRow);
  
  return createResponse({
    success: true,
    appointment: {
      id: newId,
      timestamp,
      patientName: data.patientName,
      phone: data.phone,
      date: data.date,
      time: data.time,
      type,
      status: data.status || 'Scheduled',
      notes: data.notes || ''
    }
  }, e);
}

/**
 * Update an existing appointment
 */
function updateAppointment(data, e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APPOINTMENTS_SHEET);
  
  if (!sheet) {
    return createResponse({ error: 'Appointments sheet not found' }, e);
  }
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColumn = headers.indexOf('id');
  
  // Find the row with matching ID
  const rowIndex = allData.findIndex((row, index) => 
    index > 0 && row[idColumn] === data.id
  );
  
  if (rowIndex === -1) {
    return createResponse({ error: 'Appointment not found' }, e);
  }
  
  // Update status (or other fields as needed)
  if (data.status) {
    const statusColumn = headers.indexOf('status');
    sheet.getRange(rowIndex + 1, statusColumn + 1).setValue(data.status);
  }
  
  if (data.notes !== undefined) {
    const notesColumn = headers.indexOf('notes');
    sheet.getRange(rowIndex + 1, notesColumn + 1).setValue(data.notes);
  }
  
  return createResponse({ success: true, message: 'Appointment updated' }, e);
}

/**
 * Delete an appointment
 */
function deleteAppointment(data, e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APPOINTMENTS_SHEET);
  
  if (!sheet) {
    return createResponse({ error: 'Appointments sheet not found' }, e);
  }
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColumn = headers.indexOf('id');
  
  // Find the row with matching ID
  const rowIndex = allData.findIndex((row, index) => 
    index > 0 && row[idColumn] === data.id
  );
  
  if (rowIndex === -1) {
    return createResponse({ error: 'Appointment not found' }, e);
  }
  
  sheet.deleteRow(rowIndex + 1);
  
  return createResponse({ success: true, message: 'Appointment deleted' }, e);
}

/**
 * Create response with JSONP support (bypasses CORS)
 */
function createResponse(data, e) {
  const callback = e && e.parameter ? e.parameter.callback : null;
  let output;
  
  if (callback) {
    // JSONP response - wraps JSON in callback function
    output = ContentService.createTextOutput(callback + '(' + JSON.stringify(data) + ')');
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Regular JSON response with CORS headers
    output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
  }
  
  // Always set CORS headers for POST/PUT/DELETE
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  output.setHeader('Access-Control-Max-Age', '86400');
  
  return output;
}

/**
 * Initialize the spreadsheet with proper headers (run once)
 */
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Appointments sheet
  let appointmentsSheet = ss.getSheetByName(APPOINTMENTS_SHEET);
  if (!appointmentsSheet) {
    appointmentsSheet = ss.insertSheet(APPOINTMENTS_SHEET);
  }
  
  // Set headers
  const headers = ['id', 'timestamp', 'patientName', 'phone', 'date', 'time', 'type', 'status', 'notes'];
  appointmentsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  appointmentsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  // Create Config sheet
  let configSheet = ss.getSheetByName(CONFIG_SHEET);
  if (!configSheet) {
    configSheet = ss.insertSheet(CONFIG_SHEET);
    configSheet.getRange('A1').setValue('Configuration');
  }
  
  Logger.log('Spreadsheet initialized successfully');
}
