import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url, params } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_PROXYCURL_API_KEY;

    if (!apiKey) {
      console.error('Proxycurl API key is not set');
      return NextResponse.json({ error: 'Proxycurl API key is not set' }, { status: 500 });
    }

    console.log(`Making request to Proxycurl API: ${url}`);
    console.log('Request params:', params);

    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${url}?${queryString}`;

    const response = await fetch(fullUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      console.error(`Proxycurl API responded with status ${response.status}`);
      return NextResponse.json({ error: `Proxycurl API error: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log('Successful response from Proxycurl API');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Proxycurl API request:', error);
    return NextResponse.json({ error: 'An error occurred while fetching data from Proxycurl' }, { status: 500 });
  }
}