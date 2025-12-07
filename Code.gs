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
    
    // Also support action=read to fetch appointments via POST
    if (action === 'read' || action === 'get') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // Get all sheet names for debugging
      const allSheets = ss.getSheets().map(s => s.getName());
      
      const sheet = ss.getSheetByName(APPOINTMENTS_SHEET);
      
      if (!sheet) {
        return createResponse({ 
          error: 'Appointments sheet not found', 
          sheetName: APPOINTMENTS_SHEET, 
          availableSheets: allSheets,
          spreadsheetId: ss.getId()
        }, e);
      }
      
      const sheetData = sheet.getDataRange().getValues();
      const headers = sheetData[0];
      const rows = sheetData.slice(1);
      
      // Convert all rows to objects
      const appointments = rows.map((row, idx) => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      }).filter(apt => apt.id && apt.id !== '');
      
      // Return all appointments - frontend will handle date filtering
      return createResponse({ 
        success: true, 
        appointments: appointments,
        debug: { 
          totalRows: rows.length, 
          appointmentsFound: appointments.length,
          sheetName: APPOINTMENTS_SHEET,
          availableSheets: allSheets,
          headers: headers,
          firstFewRows: rows.slice(0, 3)
        } 
      }, e);
    }
    
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
  
  // Create new appointment row with checkedIn field
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
    'No', // checkedIn default
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
      checkedIn: 'No',
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
  // Update fields as needed
  if (data.status) {
    const statusColumn = headers.indexOf('status');
    sheet.getRange(rowIndex + 1, statusColumn + 1).setValue(data.status);
  }
  
  if (data.notes !== undefined) {
    const notesColumn = headers.indexOf('notes');
    sheet.getRange(rowIndex + 1, notesColumn + 1).setValue(data.notes);
  }
  
  if (data.checkedIn !== undefined) {
    const checkedInColumn = headers.indexOf('checkedIn');
    sheet.getRange(rowIndex + 1, checkedInColumn + 1).setValue(data.checkedIn);
  }
  
  if (data.date !== undefined) {
    const dateColumn = headers.indexOf('date');
    sheet.getRange(rowIndex + 1, dateColumn + 1).setValue(data.date);
  }
  
  if (data.time !== undefined) {
    const timeColumn = headers.indexOf('time');
    sheet.getRange(rowIndex + 1, timeColumn + 1).setValue(data.time);
  }
  
  return createResponse({ success: true, message: 'Appointment updated' }, e);
  
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
 * Create response with CORS support
 */
function createResponse(data, e) {
  const callback = e && e.parameter ? e.parameter.callback : null;
  let output;
  
  if (callback) {
    // JSONP response - wraps JSON in callback function
    output = ContentService.createTextOutput(callback + '(' + JSON.stringify(data) + ')');
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Regular JSON response
    output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
  }
  
  // Note: Google Apps Script's ContentService doesn't support CORS headers via setHeader()
  // The CORS handling must be done at the Apps Script deployment level
  // For now, just return the response as-is
  
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
  
  // Set headers - added 'checkedIn' field
  const headers = ['id', 'timestamp', 'patientName', 'phone', 'date', 'time', 'type', 'status', 'checkedIn', 'notes'];
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