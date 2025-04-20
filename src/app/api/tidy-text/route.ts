import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that tidies and formats text. Improve the formatting, correct any grammatical errors, and organize the information in a clear and concise manner. Maintain all the original information but present it in a more readable format."
        },
        {
          role: "user",
          content: text
        }
      ],
    });

    const tidiedText = completion.choices[0].message.content;

    return NextResponse.json({ success: true, tidiedText });
  } catch (error) {
    console.error('Error tidying text:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}