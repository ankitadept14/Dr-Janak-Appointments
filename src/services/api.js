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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Fetched appointments:', data.appointments?.length, 'total');
    
    // Convert dates to display format
    if (data.appointments) {
      data.appointments = data.appointments.map(apt => ({
        ...apt,
        displayDate: toDisplayDate(apt.date),
        originalDate: apt.date
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
      throw new Error(`HTTP error! status: ${response.status}`);
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
      throw new Error(`HTTP error! status: ${response.status}`);
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return { success: false, error: error.message };
  }
}
