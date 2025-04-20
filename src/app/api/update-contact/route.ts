import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Remove dynamic export as it conflicts with static export
// export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { contactId, chatLogInsights } = await req.json();

    console.log("Received update request for contact:", contactId);
    console.log("Chat log insights to be added:", chatLogInsights);

    if (!contactId || !chatLogInsights) {
      return NextResponse.json({ error: 'Contact ID and chat log insights are required' }, { status: 400 });
    }

    // Get the current contact data
    const contactRef = doc(db, 'contacts', contactId);
    const contactSnap = await getDoc(contactRef);

    if (!contactSnap.exists()) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const currentContactData = contactSnap.data();
    console.log("Current contact data:", currentContactData);

    // Update the contact information in Firestore
    const updatedData = {
      otherInsights: currentContactData.otherInsights 
        ? `${currentContactData.otherInsights}\n\n${chatLogInsights}`
        : chatLogInsights
    };

    console.log("Updating contact with:", updatedData);

    await updateDoc(contactRef, updatedData);

    console.log("Contact updated successfully");

    return NextResponse.json({ success: true, message: 'Contact updated successfully' });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}