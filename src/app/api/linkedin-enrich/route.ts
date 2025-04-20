import { NextResponse } from 'next/server';

const PROXYCURL_API_KEY = process.env.NEXT_PUBLIC_PROXYCURL_API_KEY;

export async function POST(req: Request) {
  try {
    const { linkedinUrl } = await req.json();

    if (!PROXYCURL_API_KEY) {
      console.error('Proxycurl API key is not set');
      return NextResponse.json({ error: 'Proxycurl API key is not set' }, { status: 500 });
    }

    const url = 'https://nubela.co/proxycurl/api/v2/linkedin';
    const params = new URLSearchParams({
      url: linkedinUrl,
      use_cache: 'if-present',
      fallback_to_cache: 'on-error',
      skills: 'include',
      inferred_salary: 'include',
      personal_email: 'include',
      personal_contact_number: 'include',
      twitter_profile_id: 'include',
      facebook_profile_id: 'include',
      github_profile_id: 'include',
      extra: 'include',
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${PROXYCURL_API_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`Proxycurl API responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in LinkedIn data enrichment:', error);
    return NextResponse.json({ error: 'An error occurred while enriching LinkedIn data' }, { status: 500 });
  }
}