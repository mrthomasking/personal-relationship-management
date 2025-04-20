import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

interface Contact {
  id: string;
  name: string;
  // Add other contact properties as needed
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;

      const q = query(collection(db, 'contacts'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const contactsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Contact));

      setContacts(contactsData);
    };

    fetchContacts();
  }, [user]);

  return { contacts };
}