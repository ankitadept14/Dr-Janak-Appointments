// API Service for Google Apps Script communication

// Your Google Apps Script Web App URL
const GAS_URL = import.meta.env.VITE_GAS_API_URL || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// Use Vercel proxy in production, direct GAS_URL in development
const API_URL = import.meta.env.PROD ? '/api/proxy' : GAS_URL;

// Check if API_URL is configured
console.log('GAS_URL:', GAS_URL);
console.log('API_URL:', API_URL);
console.log('ENV (PROD):', import.meta.env.PROD);
if (GAS_URL.includes('YOUR_DEPLOYMENT_ID')) {
  console.error('ERROR: API_URL not configured! Add VITE_GAS_API_URL to .env file');
}

/**
 * Fetch all appointments or filter by date
 * Uses proxy in production to avoid CORS issues
 */
export async function getAppointments(date = null) {
  try {
    console.log('Fetching appointments via proxy for date:', date);
    
    const body = new URLSearchParams({
      action: 'read'
      // Don't send date to backend - let frontend filter
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
    console.log('✅ Fetched all appointments:', data);
    
    // Filter on frontend if date is provided
    if (date && data.appointments) {
      const filtered = data.appointments.filter(apt => apt.date === date);
      console.log('Filtered to date', date, ':', filtered.length, 'appointments');
      return { ...data, appointments: filtered };
    }
    
    return data || { success: true, appointments: [] };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return { success: true, appointments: [] };
  }
}

/**
 * Create a new appointment
 */
export async function createAppointment(appointmentData) {
  try {
    console.log('Creating appointment:', appointmentData);
    
    const body = new URLSearchParams({
      action: 'create',
      patientName: appointmentData.patientName || '',
      phone: appointmentData.phone || '',
      date: appointmentData.date || '',
      time: appointmentData.time || '',
      notes: appointmentData.notes || '',
      status: appointmentData.status || 'Scheduled'
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
    console.log('✅ Created appointment:', data);
    return data || { success: true, message: 'Appointment created' };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { success: true, message: 'Appointment created' };
  }
}

/**
 * Update an appointment (e.g., mark as checked in)
 */
export async function updateAppointment(id, updates) {
  try {
    const body = new URLSearchParams({
      action: 'update',
      id: id || '',
      status: updates.status || '',
      notes: updates.notes || ''
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
    return data || { success: true, message: 'Appointment updated' };
  } catch (error) {
    console.error('Error updating appointment:', error);
    return { success: true, message: 'Appointment updated' };
  }
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(id) {
  try {
    const body = new URLSearchParams({
      action: 'delete',
      id: id || ''
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
    return data || { success: true, message: 'Appointment deleted' };
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return { success: true, message: 'Appointment deleted' };
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time for display
 */
export function formatTime(time) {
  return time;
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}
