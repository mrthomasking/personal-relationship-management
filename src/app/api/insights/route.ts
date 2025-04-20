import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add dynamic export for Vercel deployment
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Insights API endpoint' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Data received' });
} 