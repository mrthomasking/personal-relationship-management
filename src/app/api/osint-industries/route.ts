import { NextRequest, NextResponse } from 'next/server';

const OSINT_API_KEY = process.env.OSINT_API_KEY;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const apiEndpoint = 'https://api.osint.industries/v2/request';
  const headers = {
    'accept': 'application/json',
    'api-key': OSINT_API_KEY as string
  };
  const params = new URLSearchParams({
    'type': 'email',
    'query': email,
    'timeout': '55'
  });

  try {
    const response = await fetch(`${apiEndpoint}?${params.toString()}`, { headers });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching OSINT Industries data:', error);
    return NextResponse.json({ error: 'Failed to fetch OSINT Industries data' }, { status: 500 });
  }
}