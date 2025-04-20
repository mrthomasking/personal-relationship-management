import { NextRequest, NextResponse } from 'next/server';

// Set route segment config using new Next.js format
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes (300 seconds) for Pro plans

const OSINT_API_KEY = process.env.OSINT_API_KEY;

// Helper function to fetch with timeout capability
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 45000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export async function POST(req: Request) {
  console.log("OSINT Industries API called");
  try {
    const { email } = await req.json();

    if (!email) {
      console.log("No email provided");
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!OSINT_API_KEY) {
      console.error("OSINT API key not set");
      return NextResponse.json({ error: 'OSINT API key is not configured' }, { status: 500 });
    }

    console.log(`Processing request for email: ${email}`);
    
    const apiEndpoint = 'https://api.osint.industries/v2/request';
    const headers = {
      'accept': 'application/json',
      'api-key': OSINT_API_KEY
    };
    const params = new URLSearchParams({
      'type': 'email',
      'query': email,
      'timeout': '45' // Setting a shorter timeout for the external API
    });

    console.log("Sending request to OSINT Industries API");
    const response = await fetchWithTimeout(
      `${apiEndpoint}?${params.toString()}`, 
      { headers },
      45000 // 45 second timeout (within Vercel's limits)
    );
    
    if (!response.ok) {
      console.error(`OSINT Industries API error: ${response.status} ${response.statusText}`);
      return NextResponse.json({ 
        error: `OSINT Industries API returned error: ${response.status}` 
      }, { status: response.status });
    }

    console.log("Successfully received response from OSINT Industries API");
    const data = await response.json();
    
    // Process the response to make it more mobile-friendly by reducing size if needed
    const processedData = processDataForMobile(data);
    
    return NextResponse.json(processedData);
  } catch (error: any) {
    console.error("Error in OSINT Industries API:", error);
    
    // Special handling for timeout errors
    if (error.name === 'AbortError') {
      console.error("Request to OSINT Industries API timed out");
      return NextResponse.json({ 
        error: 'Request to OSINT Industries API timed out. Please try again later.'
      }, { status: 504 });
    }
    
    return NextResponse.json({ 
      error: `Failed to fetch OSINT Industries data: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

// Process data to be more mobile-friendly by removing unnecessary details or large objects
function processDataForMobile(data: any) {
  // If data is not an object or is null/undefined, return as is
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  try {
    // Deep clone to avoid modifying the original
    const result = JSON.parse(JSON.stringify(data));
    
    // Remove any extremely large properties or arrays that could cause mobile rendering issues
    Object.keys(result).forEach(key => {
      const value = result[key];
      
      // Check if property is a large string (over 5000 chars)
      if (typeof value === 'string' && value.length > 5000) {
        result[key] = value.substring(0, 5000) + '... (truncated for mobile view)';
      }
      
      // Check if property is a large array (over 100 items)
      if (Array.isArray(value) && value.length > 100) {
        result[key] = value.slice(0, 100);
        result[key].push('... (truncated for mobile view)');
      }
    });
    
    return result;
  } catch (e) {
    // If any error in processing, return original data
    console.error('Error processing data for mobile:', e);
    return data;
  }
}