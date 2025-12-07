export default async function handler(req, res) {
  const GAS_URL = process.env.VITE_GAS_API_URL;

  if (!GAS_URL) {
    return res.status(500).json({ error: 'VITE_GAS_API_URL environment variable not set' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Build the request body
    let body;
    
    if (typeof req.body === 'string') {
      body = req.body;
    } else if (typeof req.body === 'object') {
      body = new URLSearchParams(req.body).toString();
    } else {
      body = '';
    }

    console.log('Proxy request body:', body);
    console.log('Forwarding to GAS_URL:', GAS_URL);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.text();
    console.log('GAS response status:', response.status);
    console.log('GAS response preview:', data.substring(0, 200));

    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(data);
    } catch (parseError) {
      console.error('Failed to parse GAS response as JSON:', parseError);
      // If it's HTML, it's likely an error page from Apps Script
      if (data.includes('<!DOCTYPE') || data.includes('<html')) {
        return res.status(500).json({ 
          error: 'Apps Script returned HTML (likely an error). Check if deployment is correct.',
          rawResponse: data.substring(0, 500)
        });
      }
      // Otherwise treat as success with raw data
      responseData = { success: true, data: data };
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}
