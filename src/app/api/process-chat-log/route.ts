import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Add dynamic export for Vercel deployment
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const chunk = formData.get('chunk') as string;
    const contactId = formData.get('contactId') as string;
    const contactName = formData.get('contactName') as string;
    const contactPhone = formData.get('contactPhone') as string;
    const chunkIndex = formData.get('chunkIndex') as string;
    const totalChunks = formData.get('totalChunks') as string;

    if (!chunk || !contactId || !contactName) {
      return NextResponse.json({ error: 'Chunk, contact ID, and contact name are required' }, { status: 400 });
    }

    // Process the chat log chunk with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using the gpt-4o model
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes WhatsApp chat logs. 
          Extract relevant information about the contact named ${contactName}${contactPhone ? ` with phone number ${contactPhone}` : ''}. 
          Ignore messages from other people. Focus on likes, interests, job information, 
          and any other relevant details about the contact. This is chunk ${parseInt(chunkIndex) + 1} of ${totalChunks}.
          Provide a concise summary of the information found in this chunk, organized by categories such as interests, work, personal life, etc.`
        },
        {
          role: "user",
          content: chunk
        }
      ],
      // Note: Removed the max_tokens parameter as it might not be applicable for this model
    });

    const result = completion.choices[0].message.content;

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error processing chat log chunk:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}