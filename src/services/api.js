// API Service for Dr. Janak Appointment System

const IS_PRODUCTION = import.meta.env.PROD;
const API_URL = IS_PRODUCTION ? '/api/proxy' : '/api/proxy';

console.log('API_URL:', API_URL);
console.log('ENV (PROD):', IS_PRODUCTION);

/**
 * Date formatting utilities
 */

// Convert DD-MM-YYYY to YYYY-MM-DD for backend
export function toBackendDate(ddmmyyyy) {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
  }
  return ddmmyyyy;
}

// Normalize time to HH:MM (24h)
function normalizeTime(value) {
  if (!value) return '';
  // If ISO datetime
  if (String(value).includes('T')) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
  }
  // If HH:MM:SS
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(String(value))) {
    const parts = String(value).split(':');
    return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}`;
  }
  // If number from Sheets (fraction of a day)
  const num = Number(value);
  if (!isNaN(num) && num > 0 && num < 2) {
    const totalMinutes = Math.round(num * 24 * 60);
    const h = String(Math.floor(totalMinutes / 60)).padStart(2,'0');
    const m = String(totalMinutes % 60).padStart(2,'0');
    return `${h}:${m}`;
  }
  return String(value);
}

// Convert YYYY-MM-DD to DD-MM-YYYY for display
export function toDisplayDate(yyyymmdd) {
  if (!yyyymmdd) return '';
  const parts = String(yyyymmdd).split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
  }
  return yyyymmdd;
}

// Get today's date in DD-MM-YYYY format
export function getTodayDate() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Get today's date in YYYY-MM-DD format (HTML5 date input)
export function getTodayDateISO() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

// Convert YYYY-MM-DD (HTML5) to DD-MM-YYYY (display)
export function isoToDisplayDate(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoDate;
}

// Convert DD-MM-YYYY (display) to YYYY-MM-DD (HTML5)
export function displayToIsoDate(displayDate) {
  if (!displayDate) return '';
  const parts = displayDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return displayDate;
}

// Get today's date in YYYY-MM-DD format for backend
export function getTodayBackendDate() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

// Generate time slots from 08:00 to 20:00 with 15-minute intervals
export function generateTimeSlots() {
  const slots = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 20 && minute > 0) break; // Stop after 20:00
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
}

/**
 * ============ AUTHENTICATION ============
 */

export async function login(id, password) {
  try {
    const body = new URLSearchParams({
      action: 'read',
      type: 'login',
      id: id,
      password: password
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ============ APPOINTMENTS ============
 */

export async function getAppointments() {
  try {
    console.log('Fetching appointments via proxy...');

    const body = new URLSearchParams({
      action: 'read',
      type: 'appointments'
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    console.log('✅ Fetched appointments:', data.appointments?.length, 'total');

    // Convert dates to display format
    if (data.appointments) {
      data.appointments = data.appointments.map(apt => ({
        ...apt,
        // Normalize date if ISO with time
        date: apt.date && String(apt.date).includes('T') ? String(apt.date).slice(0,10) : apt.date,
        displayDate: toDisplayDate(apt.date && String(apt.date).includes('T') ? String(apt.date).slice(0,10) : apt.date),
        originalDate: apt.date && String(apt.date).includes('T') ? String(apt.date).slice(0,10) : apt.date,
        time: normalizeTime(apt.time)
      }));
    }

    return { success: true, appointments: data.appointments || [] };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return { success: false, appointments: [], error: error.message };
  }
}

export async function createAppointment(formData) {
  try {
    const backendDate = toBackendDate(formData.date);

    const body = new URLSearchParams({
      action: 'create',
      type: 'appointment',
      patientName: formData.patientName,
      phone: formData.phone,
      date: backendDate,
      time: formData.time,
      doctor: formData.doctor || '',
      status: formData.status || 'Scheduled',
      notes: formData.notes || '',
      createdBy: formData.createdBy || 'System',
      gender: formData.gender || '',
      dob: formData.dob || ''
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAppointment(id, updates) {
  try {
    const body = new URLSearchParams({
      action: 'update',
      type: 'appointment',
      id: id
    });

    if (updates.status) body.append('status', updates.status);
    if (updates.notes !== undefined) body.append('notes', updates.notes);
    if (updates.paid !== undefined) body.append('paid', updates.paid);
    if (updates.date && updates.time) {
      body.append('date', toBackendDate(updates.date));
      body.append('time', updates.time);
    }
    if (updates.updatedBy) body.append('updatedBy', updates.updatedBy);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating appointment:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAppointment(id) {
  try {
    const body = new URLSearchParams({
      action: 'delete',
      type: 'appointment',
      id: id
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ============ PATIENTS ============
 */

export async function getPatients(search = '') {
  try {
    const body = new URLSearchParams({
      action: 'read',
      type: 'patients',
      search: search
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    return { success: true, patients: data.patients || [] };
  } catch (error) {
    console.error('Error fetching patients:', error);
    return { success: false, patients: [], error: error.message };
  }
}

export async function createPatient(patientData) {
  try {
    const body = new URLSearchParams({
      action: 'create',
      type: 'patient',
      name: patientData.name || '',
      phone: patientData.phone || '',
      gender: patientData.gender || '',
      dob: patientData.dob || '',
      googleDocLink: patientData.googleDocLink || ''
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating patient:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePatient(id, updates) {
  try {
    const body = new URLSearchParams({
      action: 'update',
      type: 'patient',
      id: id
    });

    if (updates.name !== undefined) body.append('name', updates.name);
    if (updates.phone !== undefined) body.append('phone', updates.phone);
    if (updates.gender !== undefined) body.append('gender', updates.gender);
    if (updates.dob !== undefined) body.append('dob', updates.dob);
    if (updates.googleDocLink !== undefined) body.append('googleDocLink', updates.googleDocLink);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating patient:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ============ DOCTORS ============
 */

export async function getDoctors() {
  try {
    const body = new URLSearchParams({
      action: 'read',
      type: 'doctors'
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    return { success: true, doctors: data.doctors || [] };
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return { success: false, doctors: [], error: error.message };
  }
}

export async function createUser(userData) {
  try {
    const body = new URLSearchParams({
      action: 'create',
      type: 'user',
      id: userData.id || '',
      password: userData.password || '',
      role: userData.role || 'nurse',
      doctorName: userData.doctorName || ''
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUser(id, updates) {
  try {
    const body = new URLSearchParams({
      action: 'update',
      type: 'user',
      id: id
    });

    if (updates.password !== undefined) body.append('password', updates.password);
    if (updates.role !== undefined) body.append('role', updates.role);
    if (updates.doctorName !== undefined) body.append('doctorName', updates.doctorName);
    if (updates.status !== undefined) body.append('status', updates.status);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      let serverError = text;
      try {
        const parsed = JSON.parse(text);
        serverError = parsed.error || parsed.message || text;
      } catch (_) {}
      throw new Error(`HTTP error ${response.status}: ${serverError}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
}
