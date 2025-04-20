import { NextResponse } from 'next/server';

// Add dynamic export to ensure the route is handled correctly
export const dynamic = "force-dynamic";

const HIBP_API_KEY = process.env.HIBP_API_KEY;

export async function POST(req: Request) {
  console.log('HIBP API route called with method:', req.method);
  
  try {
    // Log the request headers for debugging
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const { email } = await req.json();
    console.log('Email received:', email);

    if (!HIBP_API_KEY) {
      console.error('HIBP API key is not set');
      return NextResponse.json({ error: 'HIBP API key is not set', found: false }, { status: 500 });
    }

    console.log('Sending request to HIBP API for email:', email);
    const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`;
    const headers = {
      'hibp-api-key': HIBP_API_KEY,
      'User-Agent': 'PersonalRM/1.0'
    };

    console.log('Fetching from URL:', url);
    const response = await fetch(url, { headers });
    console.log('HIBP API response status:', response.status);

    if (response.status === 404) {
      console.log('No breaches found for the email');
      return NextResponse.json({ found: false, message: 'No breaches found' });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HIBP API error: Status ${response.status}`, errorText);
      return NextResponse.json({ 
        found: false, 
        error: `HIBP API responded with status ${response.status}${errorText ? ': ' + errorText : ''}` 
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('Breaches found:', data.length);
    return NextResponse.json({ found: true, breaches: data });
  } catch (error) {
    console.error('Error in HIBP API request:', error);
    return NextResponse.json({ 
      found: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
}

// Add GET method to handle OPTIONS requests and preflight checks
export async function GET() {
  return NextResponse.json({ message: 'HIBP API is working. Please use POST method with an email to check for breaches.' });
}