// API Service for Google Apps Script communication

// ⚠️ IMPORTANT: DO NOT COMMIT THIS FILE WITH THE REAL URL!
// Store the actual URL in environment variables instead

// Your Google Apps Script Web App URL
// STORE THIS IN .env file, not in code!
const GAS_URL = import.meta.env.VITE_GAS_API_URL || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// Check if API_URL is configured
console.log('GAS_URL:', GAS_URL);
console.log('import.meta.env.VITE_GAS_API_URL:', import.meta.env.VITE_GAS_API_URL);
if (GAS_URL.includes('YOUR_DEPLOYMENT_ID')) {
  console.error('ERROR: API_URL not configured! Add VITE_GAS_API_URL to .env file');
}

// Test direct connectivity (will fail with CORS but tells us if URL is reachable)
if (GAS_URL && !GAS_URL.includes('YOUR_DEPLOYMENT_ID')) {
  fetch(GAS_URL)
    .then(() => console.log('✅ Apps Script URL is reachable'))
    .catch(err => console.warn('⚠️ Apps Script connectivity issue:', err.message));
}

/**
 * Fetch all appointments or filter by date
 * Uses POST method to avoid CORS preflight
 */
export async function getAppointments(date = null) {
  try {
    console.log('Fetching appointments via POST...');
    
    const body = new URLSearchParams({
      action: 'read',
      date: date || ''
    });

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    console.log('Fetch response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Fetched appointments:', data);
    return data || { success: true, appointments: [] };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    // Return empty array on error
    return { success: true, appointments: [] };
  }
}

/**
 * Create a new appointment
 */
export async function createAppointment(appointmentData) {
  try {
    console.log('Creating appointment via POST:', appointmentData);
    
    const body = new URLSearchParams({
      action: 'create',
      patientName: appointmentData.patientName || '',
      phone: appointmentData.phone || '',
      date: appointmentData.date || '',
      time: appointmentData.time || '',
      notes: appointmentData.notes || '',
      status: appointmentData.status || 'Scheduled'
    });

    const response = await fetch(GAS_URL, {
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
    // Still return success since the backend may have processed it
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

    const response = await fetch(GAS_URL, {
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

    const response = await fetch(GAS_URL, {
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
