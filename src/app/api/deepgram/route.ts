import { NextResponse } from "next/server";

// Remove dynamic export as it conflicts with static export
// export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json({
      key: process.env.DEEPGRAM_API_KEY ?? "",
    });
}
