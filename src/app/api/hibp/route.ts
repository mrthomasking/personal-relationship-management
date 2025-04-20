import { NextResponse } from 'next/server';

const HIBP_API_KEY = process.env.HIBP_API_KEY;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!HIBP_API_KEY) {
      console.error('HIBP API key is not set');
      return NextResponse.json({ error: 'HIBP API key is not set' }, { status: 500 });
    }

    console.log('Sending request to HIBP API for email:', email);
    const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`;
    const headers = {
      'hibp-api-key': HIBP_API_KEY,
      'User-Agent': 'PersonalRM/1.0'
    };

    const response = await fetch(url, { headers });
    console.log('HIBP API response status:', response.status);

    if (response.status === 404) {
      return NextResponse.json({ message: 'No breaches found' });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HIBP API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`HIBP API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('HIBP API response data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in HIBP API request:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
}