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

/**
 * Fetch all appointments or filter by date
 */
function jsonpRequest(params) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('JSONP requests only supported in browser'));
      return;
    }

    const callbackName = `jsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    let timeoutId;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      try {
        delete window[callbackName];
      } catch (err) {
        window[callbackName] = undefined;
      }
    };

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Network error'));
    };

    const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const searchParams = new URLSearchParams({ ...filteredParams, callback: callbackName });
    script.src = `${GAS_URL}?${searchParams.toString()}`;

    const target = document.body || document.head || document.documentElement;
    target.appendChild(script);

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Request timed out'));
    }, 15000);
  });
}

/**
 * Fetch all appointments or filter by date
 */
export async function getAppointments(date = null) {
  try {
    const params = date ? { date } : {};
    const data = await jsonpRequest(params);
    console.log('Fetched data:', data);
    return data;
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
    const data = await jsonpRequest({ action: 'create', ...appointmentData });
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
    const data = await jsonpRequest({ action: 'update', id, ...updates });
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
    const data = await jsonpRequest({ action: 'delete', id });
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
