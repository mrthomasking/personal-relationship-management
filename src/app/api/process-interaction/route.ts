import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemMessage = `
You are an AI assistant that processes interaction notes and extracts relevant information. 
Carefully analyze the interaction and extract the following information:

- likes (as an array)
- job_title
- company
- religion
- education
- phone_model
- computer_model
- personality_traits
- friends
- enemies
- acquaintances
- family
- wants
- ambition
- dislikes
- house
- car
- income
- commitments
- otherInsights

Also, identify any potential reminders or important dates mentioned in the interaction.
Respond with a JSON object containing:
- 'updatedInfo': An object with all the extracted information, using the exact field names mentioned above. If a field is not mentioned in the interaction, leave it as an empty string or empty array for 'likes'.
- 'potentialReminders': An array of objects, each containing 'reminder' (string), 'date' (string in format 'DD MMM YYYY'), and 'description' (string) fields.

Example response:
{
  "updatedInfo": {
    "likes": ["traveling"],
    "job_title": "",
    "company": "",
    "religion": "",
    "education": "",
    "phone_model": "",
    "computer_model": "",
    "personality_traits": "",
    "friends": "",
    "enemies": "",
    "acquaintances": "",
    "family": "",
    "wants": "",
    "ambition": "",
    "dislikes": "",
    "house": "",
    "car": "",
    "income": "",
    "commitments": "",
    "otherInsights": "Planning a trip to Manila"
  },
  "potentialReminders": [
    {
      "reminder": "Wish safe trip to Manila",
      "date": "12 Nov 2024",
      "description": "Contact is traveling to Manila"
    }
  ]
}
`;

export async function POST(req: Request) {
  try {
    console.log("Received request to process interaction");
    const { interaction } = await req.json();
    console.log("Interaction:", interaction);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    console.log("Creating OpenAI chat completion");
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: `Process this interaction and extract relevant information: "${interaction}"`
        }
      ],
    });
    console.log("OpenAI response received");

    const result = completion.choices[0].message.content;
    console.log("Raw result:", result);

    let parsedResult: { updatedInfo: { [key: string]: any }, potentialReminders: any[] };
    try {
      parsedResult = JSON.parse(result || '{}');
      // Ensure all fields exist in updatedInfo
      const fields = ['likes', 'job_title', 'company', 'religion', 'education', 'phone_model', 'computer_model', 
                      'personality_traits', 'friends', 'enemies', 'acquaintances', 'family', 'wants', 'ambition', 
                      'dislikes', 'house', 'car', 'income', 'commitments', 'otherInsights'];
      
      parsedResult.updatedInfo = parsedResult.updatedInfo || {};
      fields.forEach(field => {
        parsedResult.updatedInfo[field] = parsedResult.updatedInfo[field] || (field === 'likes' ? [] : '');
      });

      // Ensure potentialReminders is an array and has the correct structure
      parsedResult.potentialReminders = Array.isArray(parsedResult.potentialReminders) 
        ? parsedResult.potentialReminders.map((reminder: any) => ({
            reminder: reminder.reminder || '',
            date: reminder.date || '',
            description: reminder.description || ''
          }))
        : [];
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      parsedResult = {
        updatedInfo: { otherInsights: result },
        potentialReminders: []
      };
    }
    console.log("Parsed result:", parsedResult);

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("Error processing interaction:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}