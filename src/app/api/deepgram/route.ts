import { NextResponse } from "next/server";

// Add dynamic export for Vercel deployment
export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json({
      key: process.env.DEEPGRAM_API_KEY ?? "",
    });
}
