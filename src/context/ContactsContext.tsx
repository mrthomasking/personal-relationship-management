"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Contact {
  id: string;
  name: string;
  relationship: string;
  avatar: string;
  email: string;
  phone: string;
  birthday: string;
  notes: string;
  // Add other fields as necessary
}

interface ContactsContextProps {
  contacts: Contact[];
  getContact: (id: string) => Contact | undefined;
  updateContact: (id: string, newData: Partial<Contact>) => Promise<void>;
}

const ContactsContext = createContext<ContactsContextProps | undefined>(undefined);

export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'contacts'), (snapshot) => {
      const contactsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
      setContacts(contactsData);
    });

    return () => unsubscribe();
  }, []);

  const getContact = (id: string) => contacts.find(contact => contact.id === id);

  const updateContact = async (id: string, newData: Partial<Contact>) => {
    const docRef = doc(db, 'contacts', id);
    await updateDoc(docRef, newData);
    setContacts(prevContacts => prevContacts.map(contact => contact.id === id ? { ...contact, ...newData } : contact));
  };

  return (
    <ContactsContext.Provider value={{ contacts, getContact, updateContact }}>
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};