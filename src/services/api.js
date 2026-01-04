// API Service for Dr. Janak Appointment System

const IS_PRODUCTION = import.meta.env.PROD;
const API_URL = IS_PRODUCTION ? '/api/proxy' : '/api/proxy';

console.log('API_URL:', API_URL);
console.log('ENV (PROD):', IS_PRODUCTION);

// Helpers to normalize date/time values coming from Google Sheets/Apps Script
function formatBackendDate(value) {
  // Return YYYY-MM-DD
  if (!value) return '';
  if (typeof value === 'string') {
    // Already formatted
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // If ISO string
    const iso = Date.parse(value);
    if (!Number.isNaN(iso)) {
      const d = new Date(iso);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    }
  }
  // Date object
  if (value instanceof Date) {
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${mm}-${dd}`;
  }
  return String(value);
}

function formatDisplayDate(value) {
  const backend = formatBackendDate(value);
  return toDisplayDate(backend);
}

function formatDisplayTime(value) {
  if (!value) return '';
  // If it's already HH:MM
  if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) return value;
  // If it's an ISO or Date
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  // Fallback
  return String(value);
}

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

// Get today's date in YYYY-MM-DD format for backend
export function getTodayBackendDate() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

// Generate time slots with 15-minute intervals
export function generateTimeSlots() {
  const slots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 18 && minute > 0) break; // Stop at 18:00
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
}

/**
 * Fetch all appointments
 */
export async function getAppointments() {
  try {
    console.log('Fetching appointments via proxy...');
    
    const body = new URLSearchParams({
      action: 'read'
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      // Try to surface server-provided error details to aid debugging
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
        displayDate: formatDisplayDate(apt.date),
        originalDate: formatBackendDate(apt.date),
        time: formatDisplayTime(apt.time)
      }));
    }
    
    return { success: true, appointments: data.appointments || [] };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return { success: false, appointments: [], error: error.message };
  }
}

/**
 * Create a new appointment
 */
export async function createAppointment(formData) {
  try {
    // Convert DD-MM-YYYY to YYYY-MM-DD for backend
    const backendDate = toBackendDate(formData.date);
    
    const body = new URLSearchParams({
      action: 'create',
      patientName: formData.patientName,
      phone: formData.phone,
      date: backendDate,
      time: formData.time,
      notes: formData.notes || ''
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

/**
 * Update an appointment (status, notes, check-in, reschedule)
 */
export async function updateAppointment(id, updates) {
  try {
    const body = new URLSearchParams({
      action: 'update',
      id: id
    });

    // Add updates
    if (updates.status) body.append('status', updates.status);
    if (updates.notes !== undefined) body.append('notes', updates.notes);
    if (updates.checkedIn !== undefined) body.append('checkedIn', updates.checkedIn);
    if (updates.date) body.append('date', toBackendDate(updates.date));
    if (updates.time) body.append('time', updates.time);

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

/**
 * Delete an appointment
 */
export async function deleteAppointment(id) {
  try {
    const body = new URLSearchParams({
      action: 'delete',
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
