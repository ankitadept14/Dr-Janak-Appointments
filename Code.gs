// Google Apps Script Backend for Dr. Janak Appointment System
// Deploy as Web App with "Execute as: Me" and "Who has access: Anyone"
// IMPORTANT: This script must be bound to the spreadsheet (Extensions > Apps Script from within the sheet)

const APPOINTMENTS_SHEET = 'Appointments';
const PATIENTS_SHEET = 'Patients';
const USERS_SHEET = 'Users';
const CONFIG_SHEET = 'Config';

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const action = (e.parameter.action || 'read').toLowerCase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      case 'read':
      case 'get':
        return handleRead(e, ss);
      case 'create':
        return handleCreate(e, ss);
      case 'update':
        return handleUpdate(e, ss);
      case 'delete':
        return handleDelete(e, ss);
      default:
        return createResponse({ error: 'Invalid action' }, e);
    }
  } catch (error) {
    return createResponse({ error: error.toString() }, e);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const data = e && e.parameter ? e.parameter : {};
    const action = (data.action || 'read').toLowerCase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      case 'read':
      case 'get':
        return handleRead(e, ss);
      case 'create':
        return handleCreate(e, ss);
      case 'update':
        return handleUpdate(e, ss);
      case 'delete':
        return handleDelete(e, ss);
      default:
        return createResponse({ error: 'Invalid action' }, e);
    }
  } catch (error) {
    try {
      const parsed = JSON.parse(e.postData.contents);
      const action = (parsed.action || 'read').toLowerCase();
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      switch (action) {
        case 'read':
        case 'get':
          return handleRead({ parameter: parsed }, ss);
        case 'create':
          return handleCreate({ parameter: parsed }, ss);
        case 'update':
          return handleUpdate({ parameter: parsed }, ss);
        case 'delete':
          return handleDelete({ parameter: parsed }, ss);
      }
    } catch (err) {}
    return createResponse({ error: error.toString() }, e);
  }
}

/**
 * Handle OPTIONS for CORS
 */
function doOptions(e) {
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Handle READ action - fetch data
 */
function handleRead(e, ss) {
  const params = e.parameter || {};
  const type = (params.type || 'appointments').toLowerCase();

  switch (type) {
    case 'appointments':
      return readAppointments(ss, params, e);
    case 'patients':
      return readPatients(ss, params, e);
    case 'users':
      return readUsers(ss, params, e);
    case 'doctors':
      return readDoctors(ss, params, e);
    case 'login':
      return handleLogin(ss, params, e);
    default:
      return createResponse({ error: 'Invalid type' }, e);
  }
}

/**
 * Handle CREATE action
 */
function handleCreate(e, ss) {
  const params = e.parameter || {};
  const type = (params.type || 'appointment').toLowerCase();

  switch (type) {
    case 'appointment':
      return createAppointment(ss, params, e);
    case 'patient':
      return createPatient(ss, params, e);
    case 'user':
      return createUser(ss, params, e);
    default:
      return createResponse({ error: 'Invalid type' }, e);
  }
}

/**
 * Handle UPDATE action
 */
function handleUpdate(e, ss) {
  const params = e.parameter || {};
  const type = (params.type || 'appointment').toLowerCase();

  switch (type) {
    case 'appointment':
      return updateAppointment(ss, params, e);
    case 'patient':
      return updatePatient(ss, params, e);
    case 'user':
      return updateUser(ss, params, e);
    default:
      return createResponse({ error: 'Invalid type' }, e);
  }
}

/**
 * Handle DELETE action
 */
function handleDelete(e, ss) {
  const params = e.parameter || {};
  const type = (params.type || 'appointment').toLowerCase();

  switch (type) {
    case 'appointment':
      return deleteAppointment(ss, params, e);
    case 'patient':
      return deletePatient(ss, params, e);
    case 'user':
      return deleteUser(ss, params, e);
    default:
      return createResponse({ error: 'Invalid type' }, e);
  }
}

/**
 * ============ APPOINTMENTS ============
 */

function readAppointments(ss, params, e) {
  const sheet = ss.getSheetByName(APPOINTMENTS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Appointments sheet not found' }, e);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const appointments = rows.map((row, idx) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(apt => apt.id && apt.id !== '');

  return createResponse({
    success: true,
    appointments: appointments
  }, e);
}

function createAppointment(ss, params, e) {
  const sheet = ss.getSheetByName(APPOINTMENTS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Appointments sheet not found' }, e);
  }

  // Ensure columns are text format to prevent Google Sheets auto-conversion
  ensurePatientSheetTextFormat();
  ensureAppointmentSheetTextFormat();

  // Auto-create patient if they don't exist in Patients sheet
  const patientsSheet = ss.getSheetByName(PATIENTS_SHEET);
  if (patientsSheet && params.phone) {
    const patientData = patientsSheet.getDataRange().getValues();
    const patientHeaders = patientData[0];
    const patientPhoneIndex = patientHeaders.indexOf('phone');
    
    // Check if patient exists (trim whitespace for comparison)
    const existingPatientIndex = patientData.slice(1).findIndex(row => 
      String(row[patientPhoneIndex]).trim() === String(params.phone).trim()
    );
    
    if (existingPatientIndex === -1) {
      // Patient doesn't exist - auto-create with available info
      const maxPatientId = patientData.slice(1).reduce((max, row) => {
        const id = parseInt(row[0]) || 0;
        return id > max ? id : max;
      }, 0);
      
      const newPatientId = maxPatientId + 1;
      const newPatientRow = [
        newPatientId,
        params.patientName || '',
        params.phone || '',
        params.gender || '', // gender from appointment form
        params.dob || '', // dob from appointment form
        '', // age - will be calculated by formula
        0, // totalAppointments
        '', // googleDocLink
        '', // lastAppointment
        ''  // upcomingAppointment
      ];
      
      patientsSheet.appendRow(newPatientRow);
      const newPatientRowNumber = newPatientId + 1; // +1 for header row
      
      // Force gender and DOB columns to be TEXT to prevent Google Sheets auto-conversion
      const genderCol = patientHeaders.indexOf('gender') + 1;
      const dobCol = patientHeaders.indexOf('dob') + 1;
      patientsSheet.getRange(newPatientRowNumber, genderCol).setNumberFormat('@');
      patientsSheet.getRange(newPatientRowNumber, dobCol).setNumberFormat('@');
      
      // Add age formula to the new row
      const ageColumn = 6; // Column F (age)
      patientsSheet.getRange(newPatientRowNumber, ageColumn).setFormula('=IF(E' + newPatientRowNumber + '=\"\",\"\",DATEDIF(DATE(RIGHT(E' + newPatientRowNumber + ',4),MID(E' + newPatientRowNumber + ',4,2),LEFT(E' + newPatientRowNumber + ',2)),TODAY(),\"Y\"))');
    } else {
      // Patient exists - update gender/dob if provided and empty
      const patientRowIndex = existingPatientIndex + 1; // +1 because we sliced off header
      const genderIndex = patientHeaders.indexOf('gender');
      const dobIndex = patientHeaders.indexOf('dob');
      
      if (params.gender && !patientData[patientRowIndex][genderIndex]) {
        // Force text format before setting value
        const genderCol = genderIndex + 1;
        patientsSheet.getRange(patientRowIndex + 1, genderCol).setNumberFormat('@');
        patientsSheet.getRange(patientRowIndex + 1, genderCol).setValue(params.gender);
      }
      
      if (params.dob && !patientData[patientRowIndex][dobIndex]) {
        // Force text format before setting value
        const dobCol = dobIndex + 1;
        patientsSheet.getRange(patientRowIndex + 1, dobCol).setNumberFormat('@');
        patientsSheet.getRange(patientRowIndex + 1, dobCol).setValue(params.dob);
      }
    }
  }

  // Validate double-booking
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const existingApts = allData.slice(1)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    })
    .filter(apt => apt.id);

  // Check if same doctor + date + time already exists
  const conflictingApt = existingApts.find(apt =>
    apt.doctor === params.doctor &&
    apt.date === params.date &&
    apt.time === params.time &&
    apt.status !== 'NotComing' // Exclude not coming appointments
  );

  if (conflictingApt) {
    return createResponse({
      success: false,
      error: `Double-booking detected: Doctor ${params.doctor} already has an appointment at ${params.time} on ${params.date}`
    }, e);
  }

  // Generate new ID
  const maxId = existingApts.reduce((max, apt) => {
    const id = parseInt(apt.id) || 0;
    return id > max ? id : max;
  }, 0);

  const newId = maxId + 1;
  const now = new Date().toISOString();

  const newRow = [
    newId,
    params.patientName || '',
    params.phone || '',
    params.date || '',
    params.time || '',
    params.doctor || '',
    params.status || 'Scheduled',
    params.notes || '',
    params.createdBy || 'System',
    now,
    '', // updatedBy
    '', // updatedAt
    ''  // updatedField
  ];

  // Get the column indices for date and time
  const dateColIndex = headers.indexOf('date');
  const timeColIndex = headers.indexOf('time');

  // Append the row
  sheet.appendRow(newRow);
  
  // Immediately format the date and time cells as TEXT to prevent Google Sheets auto-conversion
  const newRowNumber = allData.length + 1; // +1 for the appended row
  
  if (dateColIndex !== -1) {
    sheet.getRange(newRowNumber, dateColIndex + 1).setNumberFormat('@');
  }
  if (timeColIndex !== -1) {
    sheet.getRange(newRowNumber, timeColIndex + 1).setNumberFormat('@');
  }

  // Update patient's appointment count and last/upcoming
  updatePatientAppointmentMetadata(ss, params.phone, params.date);

  return createResponse({
    success: true,
    appointment: {
      id: newId,
      patientName: params.patientName,
      phone: params.phone,
      date: params.date,
      time: params.time,
      doctor: params.doctor,
      status: params.status || 'Scheduled',
      notes: params.notes || '',
      createdBy: params.createdBy,
      createdAt: now
    }
  }, e);
}

function updateAppointment(ss, params, e) {
  const sheet = ss.getSheetByName(APPOINTMENTS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Appointments sheet not found' }, e);
  }

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColumn = headers.indexOf('id');

  const rowIndex = allData.findIndex((row, index) =>
    index > 0 && String(row[idColumn]) === String(params.id)
  );

  if (rowIndex === -1) {
    return createResponse({ error: 'Appointment not found' }, e);
  }

  const now = new Date().toISOString();
  const updates = [];

  // Update status
  if (params.status !== undefined) {
    const statusColumn = headers.indexOf('status');
    sheet.getRange(rowIndex + 1, statusColumn + 1).setValue(params.status);
    updates.push('status');
  }

  // Update notes
  if (params.notes !== undefined) {
    const notesColumn = headers.indexOf('notes');
    sheet.getRange(rowIndex + 1, notesColumn + 1).setValue(params.notes);
    updates.push('notes');
  }

  // Update date/time (reschedule)
  if (params.date !== undefined && params.time !== undefined) {
    // Check double-booking on new time
    const existingApts = allData.slice(1)
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      })
      .filter(apt => apt.id && String(apt.id) !== String(params.id));

    const doctor = allData[rowIndex][headers.indexOf('doctor')];
    const conflict = existingApts.find(apt =>
      apt.doctor === doctor &&
      apt.date === params.date &&
      apt.time === params.time &&
      apt.status !== 'NotComing'
    );

    if (conflict) {
      return createResponse({
        success: false,
        error: 'Double-booking detected at new time'
      }, e);
    }

    const dateColumn = headers.indexOf('date');
    const timeColumn = headers.indexOf('time');
    
    // Set format to TEXT BEFORE setting values to prevent Google Sheets auto-conversion
    sheet.getRange(rowIndex + 1, dateColumn + 1).setNumberFormat('@');
    sheet.getRange(rowIndex + 1, timeColumn + 1).setNumberFormat('@');
    
    // Now set the values
    sheet.getRange(rowIndex + 1, dateColumn + 1).setValue(params.date);
    sheet.getRange(rowIndex + 1, timeColumn + 1).setValue(params.time);
    updates.push('date_time');
  }

  // Record update metadata
  if (updates.length > 0) {
    const updatedByColumn = headers.indexOf('updatedBy');
    const updatedAtColumn = headers.indexOf('updatedAt');
    const updatedFieldColumn = headers.indexOf('updatedField');

    sheet.getRange(rowIndex + 1, updatedByColumn + 1).setValue(params.updatedBy || 'System');
    sheet.getRange(rowIndex + 1, updatedAtColumn + 1).setValue(now);
    sheet.getRange(rowIndex + 1, updatedFieldColumn + 1).setValue(updates.join(', '));
  }

  return createResponse({ success: true, message: 'Appointment updated' }, e);
}

function deleteAppointment(ss, params, e) {
  const sheet = ss.getSheetByName(APPOINTMENTS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Appointments sheet not found' }, e);
  }

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColumn = headers.indexOf('id');

  const rowIndex = allData.findIndex((row, index) =>
    index > 0 && String(row[idColumn]) === String(params.id)
  );

  if (rowIndex === -1) {
    return createResponse({ error: 'Appointment not found' }, e);
  }

  sheet.deleteRow(rowIndex + 1);

  return createResponse({ success: true, message: 'Appointment deleted' }, e);
}

/**
 * ============ PATIENTS ============
 */

function readPatients(ss, params, e) {
  const sheet = ss.getSheetByName(PATIENTS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Patients sheet not found' }, e);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const patients = rows.map((row, idx) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(p => p.id && p.id !== '');

  // If search is provided, filter by name or phone (3+ chars)
  let filtered = patients;
  if (params.search && params.search.length >= 3) {
    const searchLower = params.search.toLowerCase();
    filtered = patients.filter(p =>
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.phone && p.phone.includes(params.search))
    );
  }

  return createResponse({
    success: true,
    patients: filtered
  }, e);
}

function createPatient(ss, params, e) {
  const sheet = ss.getSheetByName(PATIENTS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Patients sheet not found' }, e);
  }

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];

  // Check if patient with same phone already exists (trim whitespace)
  const phoneIndex = headers.indexOf('phone');
  const existingPatientRowIndex = allData.slice(1).findIndex(row => 
    String(row[phoneIndex]).trim() === String(params.phone).trim()
  );
  
  if (existingPatientRowIndex !== -1) {
    // Patient exists - return error so frontend doesn't create duplicate
    // The auto-creation in createAppointment will handle it
    return createResponse({
      success: false,
      error: 'Patient with this phone number already exists'
    }, e);
  }

  // Patient doesn't exist - create new
  const maxId = allData.slice(1).reduce((max, row) => {
    const id = parseInt(row[0]) || 0;
    return id > max ? id : max;
  }, 0);

  const newId = maxId + 1;

  const newRow = [
    newId,
    params.name || '',
    params.phone || '',
    params.gender || '',
    params.dob || '',
    '', // age - will be calculated by formula
    0, // totalAppointments
    params.googleDocLink || '',
    '', // lastAppointment
    ''  // upcomingAppointment
  ];

  sheet.appendRow(newRow);
  const newRowNumber = newId + 1; // ID + 1 for header row
  
  // Force gender and DOB columns to be TEXT to prevent Google Sheets auto-conversion
  const genderCol = headers.indexOf('gender') + 1;
  const dobCol = headers.indexOf('dob') + 1;
  sheet.getRange(newRowNumber, genderCol).setNumberFormat('@'); // @ = Text format
  sheet.getRange(newRowNumber, dobCol).setNumberFormat('@');
  
  // Copy age formula to the new row (parses DD-MM-YYYY format)
  const ageColumn = 6; // Column F (age)
  sheet.getRange(newRowNumber, ageColumn).setFormula('=IF(E' + newRowNumber + '="","",DATEDIF(DATE(RIGHT(E' + newRowNumber + ',4),MID(E' + newRowNumber + ',4,2),LEFT(E' + newRowNumber + ',2)),TODAY(),"Y"))');

  return createResponse({
    success: true,
    patient: {
      id: newId,
      name: params.name,
      phone: params.phone,
      gender: params.gender,
      dob: params.dob,
      age: '',
      totalAppointments: 0,
      googleDocLink: params.googleDocLink || ''
    }
  }, e);
}

function updatePatient(ss, params, e) {
  const sheet = ss.getSheetByName(PATIENTS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Patients sheet not found' }, e);
  }

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColumn = headers.indexOf('id');

  const rowIndex = allData.findIndex((row, index) =>
    index > 0 && String(row[idColumn]) === String(params.id)
  );

  if (rowIndex === -1) {
    return createResponse({ error: 'Patient not found' }, e);
  }

  // Update fields
  const fieldsToUpdate = ['name', 'phone', 'gender', 'dob', 'googleDocLink'];
  fieldsToUpdate.forEach(field => {
    if (params[field] !== undefined) {
      const colIndex = headers.indexOf(field);
      if (colIndex !== -1) {
        // Force text format for gender and dob to prevent auto-conversion
        if (field === 'gender' || field === 'dob') {
          sheet.getRange(rowIndex + 1, colIndex + 1).setNumberFormat('@');
        }
        sheet.getRange(rowIndex + 1, colIndex + 1).setValue(params[field]);
      }
    }
  });

  // Age will be automatically calculated by the formula in the sheet

  return createResponse({ success: true, message: 'Patient updated' }, e);
}

function deletePatient(ss, params, e) {
  const sheet = ss.getSheetByName(PATIENTS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Patients sheet not found' }, e);
  }

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColumn = headers.indexOf('id');

  const rowIndex = allData.findIndex((row, index) =>
    index > 0 && String(row[idColumn]) === String(params.id)
  );

  if (rowIndex === -1) {
    return createResponse({ error: 'Patient not found' }, e);
  }

  sheet.deleteRow(rowIndex + 1);

  return createResponse({ success: true, message: 'Patient deleted' }, e);
}

/**
 * ============ USERS ============
 */

function readUsers(ss, params, e) {
  const sheet = ss.getSheetByName(USERS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Users sheet not found' }, e);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const users = rows.map((row, idx) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(u => u.id && u.id !== '');

  return createResponse({
    success: true,
    users: users
  }, e);
}

function createUser(ss, params, e) {
  const sheet = ss.getSheetByName(USERS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Users sheet not found' }, e);
  }

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];

  // Check if user ID already exists
  const existingUser = allData.slice(1).find(row => row[headers.indexOf('id')] === params.id);
  if (existingUser) {
    return createResponse({
      success: false,
      error: 'User ID already exists'
    }, e);
  }

  const newRow = [
    params.id || '',
    params.password || '',
    params.role || 'nurse', // doctor, nurse, head-doctor
    params.doctorName || '', // only for doctors
    'active'
  ];

  sheet.appendRow(newRow);

  return createResponse({
    success: true,
    user: {
      id: params.id,
      role: params.role || 'nurse',
      doctorName: params.doctorName || '',
      status: 'active'
    }
  }, e);
}

function updateUser(ss, params, e) {
  const sheet = ss.getSheetByName(USERS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Users sheet not found' }, e);
  }

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColumn = headers.indexOf('id');

  const rowIndex = allData.findIndex((row, index) =>
    index > 0 && row[idColumn] === params.id
  );

  if (rowIndex === -1) {
    return createResponse({ error: 'User not found' }, e);
  }

  // Update password, role, doctorName, status
  if (params.password !== undefined) {
    const pwdColumn = headers.indexOf('password');
    sheet.getRange(rowIndex + 1, pwdColumn + 1).setValue(params.password);
  }
  if (params.role !== undefined) {
    const roleColumn = headers.indexOf('role');
    sheet.getRange(rowIndex + 1, roleColumn + 1).setValue(params.role);
  }
  if (params.doctorName !== undefined) {
    const docNameColumn = headers.indexOf('doctorName');
    sheet.getRange(rowIndex + 1, docNameColumn + 1).setValue(params.doctorName);
  }
  if (params.status !== undefined) {
    const statusColumn = headers.indexOf('status');
    sheet.getRange(rowIndex + 1, statusColumn + 1).setValue(params.status);
  }

  return createResponse({ success: true, message: 'User updated' }, e);
}

function deleteUser(ss, params, e) {
  const sheet = ss.getSheetByName(USERS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Users sheet not found' }, e);
  }

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColumn = headers.indexOf('id');

  const rowIndex = allData.findIndex((row, index) =>
    index > 0 && row[idColumn] === params.id
  );

  if (rowIndex === -1) {
    return createResponse({ error: 'User not found' }, e);
  }

  // Mark as inactive instead of deleting
  const statusColumn = headers.indexOf('status');
  sheet.getRange(rowIndex + 1, statusColumn + 1).setValue('inactive');

  return createResponse({ success: true, message: 'User deactivated' }, e);
}

/**
 * ============ DOCTORS ============
 */

function readDoctors(ss, params, e) {
  const sheet = ss.getSheetByName(USERS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Users sheet not found' }, e);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  // Return all users (doctors, head-doctors, and nurses)
  const doctors = rows
    .map((row, idx) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    })
    .filter(u => u.id && u.id !== '');

  return createResponse({
    success: true,
    doctors: doctors
  }, e);
}

/**
 * ============ AUTHENTICATION ============
 */

function handleLogin(ss, params, e) {
  const sheet = ss.getSheetByName(USERS_SHEET);
  if (!sheet) {
    return createResponse({ error: 'Users sheet not found' }, e);
  }

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColumn = headers.indexOf('id');
  const passwordColumn = headers.indexOf('password');
  const roleColumn = headers.indexOf('role');
  const doctorNameColumn = headers.indexOf('doctorName');
  const statusColumn = headers.indexOf('status');

  const user = allData.slice(1).find(row =>
    row[idColumn] === params.id &&
    row[passwordColumn] === params.password
  );

  if (!user) {
    return createResponse({
      success: false,
      error: 'Invalid ID or password'
    }, e);
  }

  if (user[statusColumn] === 'inactive') {
    return createResponse({
      success: false,
      error: 'User account is inactive'
    }, e);
  }

  return createResponse({
    success: true,
    user: {
      id: user[idColumn],
      role: user[roleColumn],
      doctorName: user[doctorNameColumn] || ''
    }
  }, e);
}

/**
 * ============ HELPERS ============
 */

function calculateAge(dob) {
  if (!dob) return 0;
  
  let age = 0;
  try {
    const dobDate = new Date(dob);
    const today = new Date();
    age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
  } catch (e) {
    age = 0;
  }
  
  return age;
}

function updatePatientAppointmentMetadata(ss, phone, appointmentDate) {
  const patientsSheet = ss.getSheetByName(PATIENTS_SHEET);
  const appointmentsSheet = ss.getSheetByName(APPOINTMENTS_SHEET);

  if (!patientsSheet || !appointmentsSheet) return;

  const patientData = patientsSheet.getDataRange().getValues();
  const patientHeaders = patientData[0];
  const patientPhoneIndex = patientHeaders.indexOf('phone');
  const patientIdIndex = patientHeaders.indexOf('id');
  const totalApptsIndex = patientHeaders.indexOf('totalAppointments');
  const lastAptIndex = patientHeaders.indexOf('lastAppointment');
  const upcomingAptIndex = patientHeaders.indexOf('upcomingAppointment');

  const patientRowIndex = patientData.findIndex((row, idx) =>
    idx > 0 && row[patientPhoneIndex] === phone
  );

  if (patientRowIndex === -1) return; // Patient not found

  // Get all appointments for this patient
  const aptData = appointmentsSheet.getDataRange().getValues();
  const aptHeaders = aptData[0];
  const aptPhoneIndex = aptHeaders.indexOf('phone');
  const aptDateIndex = aptHeaders.indexOf('date');

  const patientApts = aptData.slice(1)
    .filter(row => row[aptPhoneIndex] === phone && row[0]); // non-empty rows

  // Update total appointments
  const totalCount = patientApts.length;
  patientsSheet.getRange(patientRowIndex + 1, totalApptsIndex + 1).setValue(totalCount);

  // Find last and upcoming appointments
  const today = getTodayBackendDate();
  const pastApts = patientApts.filter(row => row[aptDateIndex] < today).sort((a, b) => b[aptDateIndex].localeCompare(a[aptDateIndex]));
  const futureApts = patientApts.filter(row => row[aptDateIndex] >= today).sort((a, b) => a[aptDateIndex].localeCompare(b[aptDateIndex]));

  const lastApt = pastApts.length > 0 ? pastApts[0][aptDateIndex] : '';
  const upcomingApt = futureApts.length > 0 ? futureApts[0][aptDateIndex] : '';

  patientsSheet.getRange(patientRowIndex + 1, lastAptIndex + 1).setValue(lastApt);
  patientsSheet.getRange(patientRowIndex + 1, upcomingAptIndex + 1).setValue(upcomingApt);
}

function getTodayBackendDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Ensure sheet columns are properly formatted as text
 */
function ensurePatientSheetTextFormat() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const patientsSheet = ss.getSheetByName(PATIENTS_SHEET);
  
  if (!patientsSheet) return;
  
  const data = patientsSheet.getDataRange().getValues();
  if (data.length < 2) return; // Only header
  
  const headers = data[0];
  const genderColIndex = headers.indexOf('gender');
  const dobColIndex = headers.indexOf('dob');
  
  // Format entire columns as text to prevent auto-conversion
  if (genderColIndex !== -1) {
    const genderCol = genderColIndex + 1;
    patientsSheet.getRange(genderCol + ':' + genderCol).setNumberFormat('@');
  }
  
  if (dobColIndex !== -1) {
    const dobCol = dobColIndex + 1;
    patientsSheet.getRange(dobCol + ':' + dobCol).setNumberFormat('@');
  }
}

/**
 * Ensure Appointments sheet columns are properly formatted as text
 */
function ensureAppointmentSheetTextFormat() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const appointmentsSheet = ss.getSheetByName(APPOINTMENTS_SHEET);
  
  if (!appointmentsSheet) return;
  
  const data = appointmentsSheet.getDataRange().getValues();
  if (data.length < 2) return; // Only header
  
  const headers = data[0];
  const dateColIndex = headers.indexOf('date');
  const timeColIndex = headers.indexOf('time');
  
  // Format entire columns as text to prevent auto-conversion
  if (dateColIndex !== -1) {
    const dateCol = dateColIndex + 1;
    appointmentsSheet.getRange(dateCol + ':' + dateCol).setNumberFormat('@');
  }
  
  if (timeColIndex !== -1) {
    const timeCol = timeColIndex + 1;
    appointmentsSheet.getRange(timeCol + ':' + timeCol).setNumberFormat('@');
  }
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
  
  return output;
}

/**
 * Initialize the spreadsheet with proper headers and sheets (run once)
 */
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create Appointments sheet
  let appointmentsSheet = ss.getSheetByName(APPOINTMENTS_SHEET);
  if (!appointmentsSheet) {
    appointmentsSheet = ss.insertSheet(APPOINTMENTS_SHEET);
  }
  const appointmentHeaders = [
    'id', 'patientName', 'phone', 'date', 'time', 'doctor', 'status', 'notes',
    'createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'updatedField'
  ];
  appointmentsSheet.getRange(1, 1, 1, appointmentHeaders.length).setValues([appointmentHeaders]);
  appointmentsSheet.getRange(1, 1, 1, appointmentHeaders.length).setFontWeight('bold');

  // Create Patients sheet
  let patientsSheet = ss.getSheetByName(PATIENTS_SHEET);
  if (!patientsSheet) {
    patientsSheet = ss.insertSheet(PATIENTS_SHEET);
  }
  const patientHeaders = [
    'id', 'name', 'phone', 'gender', 'dob', 'age', 'totalAppointments',
    'googleDocLink', 'lastAppointment', 'upcomingAppointment'
  ];
  patientsSheet.getRange(1, 1, 1, patientHeaders.length).setValues([patientHeaders]);
  patientsSheet.getRange(1, 1, 1, patientHeaders.length).setFontWeight('bold');
  
  // Set formula for age column (column F, starting from row 2)
  // This will auto-calculate age from DOB (DD-MM-YYYY format)
  patientsSheet.getRange('F2').setFormula('=IF(E2="","",DATEDIF(DATE(RIGHT(E2,4),MID(E2,4,2),LEFT(E2,2)),TODAY(),"Y"))');
  
  // Note: When new patients are added, the formula will be automatically copied

  // Create Users sheet
  let usersSheet = ss.getSheetByName(USERS_SHEET);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(USERS_SHEET);
  }
  const userHeaders = ['id', 'password', 'role', 'doctorName', 'status'];
  usersSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
  usersSheet.getRange(1, 1, 1, userHeaders.length).setFontWeight('bold');

  // Create Config sheet
  let configSheet = ss.getSheetByName(CONFIG_SHEET);
  if (!configSheet) {
    configSheet = ss.insertSheet(CONFIG_SHEET);
    configSheet.getRange('A1').setValue('Configuration');
  }

  Logger.log('Spreadsheet initialized successfully');
}