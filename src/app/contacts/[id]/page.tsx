"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SocialMediaSearch } from '@/components/SocialMediaSearch';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { toast } from 'react-hot-toast';

export default function ContactDetails() {
  const params = useParams();
  const id = params?.id as string;
  const [contact, setContact] = useState<any>(null);

  useEffect(() => {
    const fetchContact = async () => {
      if (id) {
        const docRef = doc(db, 'contacts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContact({ id: docSnap.id, ...docSnap.data() });
        }
      }
    };
    fetchContact();
  }, [id]);

  const handleSocialMediaResults = async (results: any) => {
    if (!contact) return;

    const updatedContact = {
      ...contact,
      linkedIn: results.linkedin || contact.linkedIn,
      twitter: results.twitter || contact.twitter,
      facebook: results.facebook || contact.facebook,
    };

    try {
      const docRef = doc(db, 'contacts', id);
      await updateDoc(docRef, updatedContact);
      setContact(updatedContact);
      toast.success('Contact updated with social media information');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    }
  };

  const handleSearch = async (name: string) => {
    // Implement your social media search logic here
    // For now, we'll return a mock result
    return {
      linkedin: null,
      twitter: null,
      facebook: `https://facebook.com/${Math.floor(Math.random() * 1000000000)}`,
    };
  };

  if (!contact) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{contact.name}</h1>
      {/* Display other contact details here */}
      <div>
        {contact.linkedIn && <p>LinkedIn: {contact.linkedIn}</p>}
        {contact.twitter && <p>Twitter: {contact.twitter}</p>}
        {contact.facebook && <p>Facebook: {contact.facebook}</p>}
      </div>
      <SocialMediaSearch onResultsFound={handleSocialMediaResults} onSearch={handleSearch} />
    </div>
  );
}