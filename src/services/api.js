// API Service for Google Apps Script communication

// ⚠️ IMPORTANT: DO NOT COMMIT THIS FILE WITH THE REAL URL!
// Store the actual URL in environment variables instead

// Your Google Apps Script Web App URL
// STORE THIS IN .env file, not in code!
const GAS_URL = import.meta.env.VITE_GAS_API_URL || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// CORS proxy for localhost development
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const CORS_PROXY = isDevelopment ? 'https://cors-anywhere.herokuapp.com/' : '';
const API_URL = isDevelopment ? CORS_PROXY + GAS_URL : GAS_URL;

// Check if API_URL is configured
console.log('GAS_URL:', GAS_URL);
console.log('import.meta.env.VITE_GAS_API_URL:', import.meta.env.VITE_GAS_API_URL);
if (GAS_URL.includes('YOUR_DEPLOYMENT_ID')) {
  console.error('ERROR: API_URL not configured! Add VITE_GAS_API_URL to .env file');
}

/**
 * Fetch all appointments or filter by date
 */
export async function getAppointments(date = null) {
  try {
    const url = date ? `${API_URL}?date=${date}` : API_URL;
    console.log('Fetching appointments from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}

/**
 * Create a new appointment
 */
export async function createAppointment(appointmentData) {
  try {
    console.log('Creating appointment:', appointmentData);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        action: 'create',
        ...appointmentData
      }),
    });
    
    console.log('Create response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Created appointment:', data);
    return data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
}

/**
 * Update an appointment (e.g., mark as checked in)
 */
export async function updateAppointment(id, updates) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        action: 'update',
        id,
        ...updates
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(id) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        action: 'delete',
        id
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
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
