import { NextResponse } from "next/server";
import OpenAI from "openai";

// Add dynamic export for Vercel deployment
export const dynamic = "force-dynamic";

const openai = new OpenAI();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const base64Audio = body.audio;

    // Convert the base64 audio data to a Blob
    const audioBlob = Buffer.from(base64Audio, "base64");
    
    // Create a File object from the Blob
    const file = new File([audioBlob], "audio.wav", { type: "audio/wav" });

    const data = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 });
  }
}
