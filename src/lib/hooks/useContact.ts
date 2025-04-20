import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useContact(contactId: string) {
  const [contact, setContact] = useState<any>(null);

  useEffect(() => {
    const fetchContact = async () => {
      console.log("Fetching contact with ID:", contactId);
      const contactRef = doc(db, 'contacts', contactId);
      const contactSnap = await getDoc(contactRef);
      if (contactSnap.exists()) {
        const contactData = contactSnap.data();
        console.log("Fetched contact data:", contactData);
        setContact(contactData);
      } else {
        console.log("No contact found with ID:", contactId);
      }
    };

    fetchContact();
  }, [contactId]);

  const updateContact = useCallback(async (updatedData: any) => {
    try {
      console.log("Updating contact with ID:", contactId);
      console.log("Update data:", updatedData);
      const contactRef = doc(db, 'contacts', contactId);
      await updateDoc(contactRef, updatedData);
      setContact(prevContact => {
        const newContact = { ...prevContact, ...updatedData };
        console.log("Updated contact in state:", newContact);
        return newContact;
      });
      console.log("Contact updated successfully");
    } catch (error) {
      console.error("Error updating contact:", error);
      throw error;
    }
  }, [contactId]);

  return { contact, updateContact };
}