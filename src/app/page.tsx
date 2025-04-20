'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import SignIn from '@/components/SignIn'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Plus, Users, Calendar, FileText, Menu, ChevronDown, ChevronUp, UserPlus, LogOut, Bell, Check, X, CalendarClock, Star, StarOff, Upload } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, query, where, orderBy } from 'firebase/firestore'
import { AddInteractionForm } from '@/components/AddInteractionForm'
import ErrorBoundary from '@/components/ErrorBoundary'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { ReminderForm } from '@/components/ReminderForm';
import ConfirmationModal from '@/components/ConfirmationModal';
import dynamic from 'next/dynamic';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { UploadChatLog } from '@/components/UploadChatLog';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// @ts-nocheck

interface Contact {
  id: string
  userId: string;
  name: string; // Changed from optional to required
  relationship?: string;
  avatar: string
  email: string
  phone: string
  birthday: string
  notes: string
  age: number
  address: string
  linkedin: string
  twitter: string
  facebook: string
  job_title: string
  company: string
  last_spoken_date: string
  religion: string
  nationality: string
  education: string
  gender: 'male' | 'female' | 'other'
  phone_model: string
  computer_model: string
  personality_traits: string
  instagram: string
  tiktok: string
  relationship_with_me: string
  friends: string
  enemies: string
  acquaintances: string
  family: string
  wants: string
  ambition: string
  likes: string
  dislikes: string
  house: string
  car: string
  income: string
  commitments: string
  breaches: string;
  linkedin_profile_pic_url?: string;
  linkedin_headline?: string;
  linkedin_summary?: string;
  linkedin_occupation?: string;
  linkedin_location?: string;
  linkedin_experience?: string;
  linkedin_education?: string;
  linkedin_skills?: string;
  linkedin_certifications?: string;
  linkedin_projects?: string;
  linkedin_recommendations?: string;
  linkedin_activities?: string;
  linkedin_inferred_salary?: string;
  osint?: string;
  generalInsights?: string;  // Add this new field
  starred?: boolean;
}

interface AddContactFormProps {
  onAddContact: (contact: Omit<Contact, 'id'>) => void
  onCancel: () => void
}

interface Interaction {
  id: string
  contactId: string
  date: string
  type: string
  notes: string
  createdAt: Date
}

// Add this interface after the other interfaces
interface Reminder {
  id: string;
  contactId: string;
  title: string;
  description: string;
  date: string;
  isCompleted: boolean;
}

// Replace the existing contactFieldOrder array with this:
const contactFieldOrder = [
  // Basic
  { header: "Basic", fields: [
    'name', 'relationship', 'email', 'phone', 'birthday', 'age', 'gender', 'address', 'nationality', 'job_title', 'company'
  ]},
  // Social Media
  { header: "Social Media", fields: [
    'linkedin', 'twitter', 'facebook', 'instagram', 'tiktok'
  ]},
  // Details
  { header: "Details", fields: [
    'religion', 'education', 'phone_model', 'computer_model', 'personality_traits', 'friends', 'enemies', 'acquaintances', 'family', 'wants', 'ambition', 'likes', 'dislikes', 'house', 'car', 'income', 'commitments', 'otherInsights'
  ]},
  // LinkedIn
  { header: "LinkedIn", fields: [
    'linkedin_profile_pic_url', 'linkedin_headline', 'linkedin_summary', 'linkedin_occupation', 
    'linkedin_location', 'linkedin_experience', 'linkedin_education', 'linkedin_skills', 
    'linkedin_certifications', 'linkedin_projects', 'linkedin_recommendations', 
    'linkedin_activities', 'linkedin_inferred_salary'
  ]},
  // Supplements
  { header: "Supplements", fields: [
    'breaches',
    'osint'
  ]}
];

interface Certification {
  name: string;
  authority: string;
  starts_at: {
    day: number;
    month: number;
    year: number;
  };
  url: string;
}

const formatCertifications = (certifications: Certification[]): string => {
  return certifications.map(cert => {
    const startDate = new Date(cert.starts_at.year, cert.starts_at.month - 1, cert.starts_at.day);
    return `
• ${cert.name}
  Issued by: ${cert.authority}
  Date: ${startDate.toLocaleDateString()}
  URL: ${cert.url}
    `;
  }).join('\n');
};

function formatOsintData(data: any): React.ReactNode {
  return (
    <div className="prose prose-sm max-w-none">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="mb-4">
          <h3 className="text-lg font-semibold">{key}</h3>
          {formatOsintValue(value)}
        </div>
      ))}
    </div>
  );
}

function formatOsintValue(value: any): React.ReactNode {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc pl-5">
          {value.map((item, index) => (
            <li key={index}>{formatOsintValue(item)}</li>
          ))}
        </ul>
      );
    } else {
      return (
        <div className="pl-4">
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey} className="mb-2">
              <span className="font-medium">{subKey}: </span>
              {formatOsintValue(subValue)}
            </div>
          ))}
        </div>
      );
    }
  } else {
    return <span>{String(value)}</span>;
  }
}

// Update the formatValue function
const formatValue = (key: string, value: any): React.ReactNode => {
  if (key === 'osint') {
    return <OsintField value={value} />;
  }

  if (key === 'otherInsights') {
    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
      </div>
    );
  }

  if (typeof value === 'string' && (key.startsWith('linkedin_') || key === 'breaches' || key === 'osint')) {
    try {
      value = JSON.parse(value);
    } catch (e) {
      // If parsing fails, we'll use the original string value
    }
  }

  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      if (key === 'linkedin_experience') {
        return (
          <ul className="list-disc pl-5 space-y-4">
            {value.map((exp: any, index: number) => (
              <li key={index}>
                <div className="font-semibold">{exp.title}</div>
                <div>{exp.company}</div>
                <div className="text-sm text-gray-600">
                  {exp.starts_at?.month && exp.starts_at?.year 
                    ? `${exp.starts_at.month}/${exp.starts_at.year}` 
                    : ''} - 
                  {exp.ends_at 
                    ? `${exp.ends_at.month}/${exp.ends_at.year}` 
                    : 'Present'}
                </div>
                {exp.location && <div className="text-sm">{exp.location}</div>}
                {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
              </li>
            ))}
          </ul>
        );
      } else if (key === 'linkedin_education') {
        return (
          <ul className="list-disc pl-5 space-y-4">
            {value.map((edu: any, index: number) => (
              <li key={index}>
                <div className="font-semibold">{edu.school}</div>
                <div>{edu.degree_name} {edu.field_of_study && `in ${edu.field_of_study}`}</div>
                <div className="text-sm text-gray-600">
                  {edu.starts_at?.year && edu.ends_at?.year 
                    ? `${edu.starts_at.year} - ${edu.ends_at.year}` 
                    : ''}
                </div>
                {edu.activities_and_societies && (
                  <p className="text-sm mt-1">Activities: {edu.activities_and_societies}</p>
                )}
              </li>
            ))}
          </ul>
        );
      } else if (key === 'linkedin_skills') {
        return (
          <div className="flex flex-wrap gap-2">
            {value.map((skill: string, index: number) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        );
      } else if (key === 'linkedin_certifications') {
        return (
          <ul className="list-disc pl-5 space-y-4">
            {value.map((cert: any, index: number) => (
              <li key={index}>
                <div className="font-semibold">{cert.name}</div>
                {cert.authority && <div className="text-sm">Issued by: {cert.authority}</div>}
                {cert.starts_at?.month && cert.starts_at?.year && (
                  <div className="text-sm text-gray-600">
                    Issued: {cert.starts_at.month}/{cert.starts_at.year}
                  </div>
                )}
              </li>
            ))}
          </ul>
        );
      }
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const AddContactForm: React.FC<AddContactFormProps> = ({ onAddContact, onCancel }) => {
  const [newContact, setNewContact] = useState<Omit<Contact, 'id'>>({
    name: '',
    relationship: '',
    avatar: '/placeholder-user.jpg',
    email: '',
    phone: '',
    birthday: '',
    notes: '',
    age: 0,
    address: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    job_title: '',
    company: '',
    last_spoken_date: '',
    religion: '',
    nationality: '',
    education: '',
    gender: 'male',
    phone_model: '',
    computer_model: '',
    personality_traits: '',
    instagram: '',
    tiktok: '',
    relationship_with_me: '',
    friends: '',
    enemies: '',
    acquaintances: '',
    family: '',
    wants: '',
    ambition: '',
    likes: '',
    dislikes: '',
    house: '',
    car: '',
    income: '',
    commitments: '',
    breaches: '',
    userId: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Form submitted with data:", newContact);
    onAddContact(newContact);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setNewContact(prev => ({ ...prev, [id]: value }));
  }

  const handleFormClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col" onClick={handleFormClick}>
      <div className="p-6 flex-grow overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add New Contact</h2>
        
        {contactFieldOrder.map((section) => (
          <div key={section.header} className="mb-6">
            <h3 className="font-bold text-lg mb-2">{section.header}</h3>
            {section.fields.map((key) => (
              <div key={key} className="mb-4">
                <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {key.replace(/_/g, ' ')}
                </label>
                {key === 'gender' ? (
                  <select
                    id={key}
                    value={newContact[key as keyof Omit<Contact, 'id'>] || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <Input
                    id={key}
                    value={newContact[key as keyof Omit<Contact, 'id'>] || ''}
                    onChange={handleInputChange}
                    className="w-full"
                    type={key === 'birthday' || key === 'last_spoken_date' ? 'date' : 'text'}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Fixed position buttons at the bottom */}
      <div className="p-4 bg-white border-t flex justify-end space-x-2">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit">Add Contact</Button>
      </div>
    </form>
  );
};

// Add this new component
const OsintField: React.FC<{ value: string }> = ({ value }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const parseOsintData = (data: any): any => {
    if (typeof data !== 'object' || data === null) return data;

    return Object.entries(data).reduce((acc: any, [key, val]) => {
      if (key === 'front_schemas' || key === 'spec_format' || key === 'default_schema') return acc;
      if (key === 'module' && val === 'maps') {
        acc[key] = val;
        if (typeof data.data === 'object' && data.data !== null) {
          acc.data = {
            visibility: data.data.visibility,
            stats: data.data.stats,
            reviews: data.data.reviews.map((review: any) => ({
              date: review.date,
              location: {
                name: review.location.name,
                address: review.location.address,
                cost_level: review.location.cost_level,
              },
              comment: review.comment,
              rating: review.rating,
            })),
          };
        }
      } else if (typeof val === 'object' && val !== null) {
        acc[key] = parseOsintData(val);
      } else if (val !== null && val !== '') {
        acc[key] = val;
      }
      return acc;
    }, {});
  };

  let parsedValue: any;
  try {
    const rawData = JSON.parse(value);
    parsedValue = rawData.map((item: any) => parseOsintData(item));
      } catch (error) {
    parsedValue = value;
  }

  const formatOsintData = (data: any, depth = 0): JSX.Element => {
    if (typeof data !== 'object' || data === null) {
      return <span>{String(data)}</span>;
    }

    return (
      <div style={{ marginLeft: `${depth * 20}px` }}>
        {Object.entries(data).map(([key, value], index) => (
          <div key={index} className="mb-1">
            <strong>{key}:</strong>{' '}
            {typeof value === 'object' && value !== null ? (
              <div>{formatOsintData(value, depth + 1)}</div>
            ) : (
              <span>{String(value)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getOsintSummary = (data: any): string => {
    const moduleCount = data.length;
    const modules = data.map((item: any) => item.module).join(', ');
    return `OSINT data available from ${moduleCount} module${moduleCount !== 1 ? 's' : ''}: ${modules}`;
  };

  return (
    <div className="relative">
      <div className="prose prose-sm max-w-none">
        {isExpanded ? (
          <div className="whitespace-pre-wrap">{formatOsintData(parsedValue)}</div>
        ) : (
          <div className="text-gray-600 italic">{getOsintSummary(parsedValue)}</div>
        )}
      </div>
      <div className="mt-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-500 hover:text-blue-700 font-medium"
        >
          {isExpanded ? 'View Less' : 'View More'}
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContact, setEditedContact] = useState<Contact | null>(null)
  const [showAllFields, setShowAllFields] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileListView, setIsMobileListView] = useState(true)
  const [isAddingInteraction, setIsAddingInteraction] = useState(false)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [isSearchingSocialMedia, setIsSearchingSocialMedia] = useState(false)
  const [socialMediaResults, setSocialMediaResults] = useState<string | null>(null)
  const [isCheckingBreaches, setIsCheckingBreaches] = useState(false)
  const [isEnrichingLinkedIn, setIsEnrichingLinkedIn] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isMobileAddingContact, setIsMobileAddingContact] = useState(false)
  const [isSearchingOsint, setIsSearchingOsint] = useState(false)
  const [isAddingGlobalInteraction, setIsAddingGlobalInteraction] = useState(false)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isAddingReminder, setIsAddingReminder] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isUploadingChatLog, setIsUploadingChatLog] = useState(false);

  const fetchReminders = useCallback(async (contactId?: string) => {
    if (!contactId) {
      setReminders([]);
      return;
    }
    try {
      const q = query(collection(db, 'reminders'), where('contactId', '==', contactId), orderBy('date'));
      const querySnapshot = await getDocs(q);
      const remindersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
      console.log("Fetched reminders:", remindersData);
      setReminders(remindersData);
      } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    if (!user) {
      console.log("No user logged in, cannot fetch contacts");
      return;
    }
    console.log("Fetching contacts for user:", user.uid);
    const q = query(collection(db, 'contacts'), where("userId", "==", user.uid));
    getDocs(q).then((querySnapshot) => {
      const contactsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), starred: doc.data().starred || false } as Contact));
      console.log("Contacts fetched:", contactsData);
      setContacts(contactsData);
    }).catch((error) => {
      console.error("Error fetching contacts:", error);
    });
  }, [user?.uid]);

  useEffect(() => {
    setIsClient(true)
    if (user) {
      fetchContacts()
    }
  }, [user, fetchContacts])

  useEffect(() => {
    if (selectedContact) {
      fetchReminders(selectedContact.id)
    } else {
      setReminders([])
    }
  }, [selectedContact, fetchReminders])

  // Add this function near the other useCallback functions
  const toggleStarContact = useCallback(async (contactId: string) => {
    const contactToUpdate = contacts.find(c => c.id === contactId);
    if (contactToUpdate) {
      const updatedContact = { ...contactToUpdate, starred: !contactToUpdate.starred };
      try {
        await updateDoc(doc(db, 'contacts', contactId), { starred: updatedContact.starred });
        setContacts(prevContacts => 
          prevContacts.map(c => c.id === contactId ? updatedContact : c)
        );
        toast.success(updatedContact.starred ? 'Contact starred' : 'Contact unstarred');
    } catch (error) {
        console.error("Error updating contact star status:", error);
        toast.error('Failed to update contact star status');
      }
    }
  }, [contacts]);

  // Replace the existing filteredContacts useMemo with this corrected version
  const filteredContacts = useMemo(() => {
    if (!contacts || contacts.length === 0) return [];
    return contacts
      .filter(contact =>
        (contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (contact.relationship?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      )
      .sort((a, b) => {
        if (a.starred === b.starred) {
          return a.name.localeCompare(b.name);
        }
        return a.starred ? -1 : 1;
      });
  }, [contacts, searchTerm]);

  const handleAddReminder = useCallback(() => {
    if (!selectedContact) {
      toast.error('Please select a contact first');
      return;
    }
    setIsAddingReminder(true);
  }, [selectedContact]);

  const handleReminderAdded = useCallback(() => {
    setIsAddingReminder(false);
    if (selectedContact) {
      fetchReminders(selectedContact.id);
    }
    toast.success('Reminder added successfully');
  }, [selectedContact, fetchReminders]);

  const handleReminderCompletion = useCallback(async (reminderId: string, isCompleted: boolean) => {
    try {
      const reminderRef = doc(db, 'reminders', reminderId);
      await updateDoc(reminderRef, { isCompleted });
      toast.success(isCompleted ? 'Reminder marked as completed' : 'Reminder marked as incomplete');
      if (selectedContact) {
        fetchReminders(selectedContact.id);
      }
    } catch (error) {
      console.error("Error updating reminder: ", error);
      toast.error('Failed to update reminder');
    }
  }, [selectedContact, fetchReminders]);

  const handleAddContact = useCallback(() => {
    setIsAddingContact(true)
    setIsMobileListView(false)
    setSelectedContact(null)
    setIsMobileAddingContact(true)
  }, [])

  const handleCancelAddContact = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsAddingContact(false);
    setIsMobileListView(true);
    setIsMobileAddingContact(false);
  }, []);

  const handleAddNewContact = useCallback(async (newContact: Omit<Contact, 'id'>) => {
    if (!user) {
      console.error("No user logged in");
      toast.error("You must be logged in to add a contact");
      return;
    }
    try {
      const contactWithUserId = { ...newContact, userId: user.uid };
      const docRef = await addDoc(collection(db, 'contacts'), contactWithUserId);
      const contactToAdd: Contact = { id: docRef.id, ...contactWithUserId };
      setContacts(prevContacts => [...prevContacts, contactToAdd]);
      setIsAddingContact(false);
      setIsMobileListView(true);
      setIsMobileAddingContact(false);
      toast.success("Contact added successfully");
    } catch (error) {
      console.error("Error adding contact: ", error);
      toast.error("Failed to add contact. Please try again.");
    }
  }, [user])

  const deleteContact = useCallback(async (contactId: string) => {
    setContactToDelete(contactId);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (contactToDelete) {
      try {
        await deleteDoc(doc(db, 'contacts', contactToDelete))
        setContacts(contacts.filter(contact => contact.id !== contactToDelete))
        setSelectedContact(null)
        toast.success('Contact deleted successfully')
      } catch (error) {
        console.error("Error deleting contact:", error)
        toast.error('Failed to delete contact')
      }
    }
    setIsDeleteModalOpen(false);
    setContactToDelete(null);
  }, [contactToDelete, contacts]);

  const handleUpdateContact = useCallback(async (updatedContact: Contact) => {
    try {
      const contactRef = doc(db, 'contacts', updatedContact.id);
      const updateData = Object.entries(updatedContact).reduce((acc, [key, value]) => {
        if (key !== 'id') {
          acc[key] = value;
        }
        return acc;
      }, {} as { [key: string]: any });
      
      await updateDoc(contactRef, updateData);
      setContacts(contacts.map(contact => 
        contact.id === updatedContact.id ? updatedContact : contact
      ));
      setSelectedContact(updatedContact);
    } catch (error) {
      console.error("Error updating contact: ", error);
    }
  }, [contacts])

  const handleEditContact = useCallback(() => {
    if (selectedContact) {
      setEditedContact({ ...selectedContact })
      setIsEditing(true)
      setIsMobileListView(false) // Add this line
    }
  }, [selectedContact])

  const handleCancelEdit = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsEditing(false)
    setEditedContact(null)
    // Don't change the mobile view when canceling edit
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (editedContact) {
      await handleUpdateContact(editedContact)
      setIsEditing(false)
      setEditedContact(null)
      // Don't change the mobile view when saving edit
    }
  }, [editedContact, handleUpdateContact])

  const handleAddInteraction = useCallback(() => {
    setIsAddingInteraction(true)
  }, [])

  const handleInteractionAdded = useCallback(() => {
    setIsAddingInteraction(false)
    if (selectedContact) {
      fetchInteractions(selectedContact.id)
    }
  }, [selectedContact])

  const fetchInteractions = useCallback(async (contactId: string) => {
    try {
      console.log("Fetching interactions for contact ID:", contactId)
      const q = query(
        collection(db, 'interactions'),
        where('contactId', '==', contactId),
        orderBy('date', 'desc')
      )
      console.log("Query:", q)
      const querySnapshot = await getDocs(q)
      console.log("Query snapshot:", querySnapshot)
      const interactionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Interaction[]
      console.log("Fetched interactions:", interactionsData)
      setInteractions(interactionsData)
    } catch (error) {
      console.error("Error fetching interactions: ", error)
      if (error instanceof Error && error.message.includes("The query requires an index")) {
        console.log("This error is likely due to a missing Firestore index. Please check the Firebase console to create the required index.")
      }
      setInteractions([])
    }
  }, [])

  const updateContact = useCallback(async (updatedContact: Partial<Contact> & { id: string }) => {
    try {
      const contactRef = doc(db, 'contacts', updatedContact.id);
      await updateDoc(contactRef, updatedContact);
      setContacts(prevContacts => prevContacts.map(c => c.id === updatedContact.id ? { ...c, ...updatedContact } : c));
      setSelectedContact(prev => prev && prev.id === updatedContact.id ? { ...prev, ...updatedContact } : prev);
    } catch (error) {
      console.error("Error updating contact:", error);
    }
  }, [])

  const searchSocialMediaProfiles = useCallback(async (contact: Contact) => {
    if (!contact.email && !contact.phone) {
      toast.error("No email or phone number provided for social media search")
      return
    }

    console.log("Starting social media profile search")
    setIsSearchingSocialMedia(true)
    setSocialMediaResults(null)

    try {
      let linkedinProfile, twitterProfile, facebookProfile

      const makeRequest = async (url: string, params: any) => {
        console.log(`Attempting request to ${url} with params:`, params)
        try {
          const response = await fetch('/api/proxycurl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, params }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response from API route: Status ${response.status}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }
          
          const data = await response.json()
          console.log(`Successful response from ${url}:`, data)
          return data
        } catch (error) {
          console.error(`Error in request to ${url}:`, error)
          toast.error(`API error: ${error.message || 'Unknown error'}`)
          throw error
        }
      }

      if (contact.email) {
        console.log("Searching with email:", contact.email)
        try {
          const emailResponse = await makeRequest('https://nubela.co/proxycurl/api/linkedin/profile/resolve/email', {
            email: contact.email,
            lookup_depth: 'deep',
            enrich_profile: 'enrich'
          })
          linkedinProfile = emailResponse.linkedin_profile_url
          console.log("LinkedIn profile found:", linkedinProfile)
        } catch (error) {
          console.error("Error in email search:", error)
        }
      }

      if (contact.phone) {
        console.log("Searching with phone:", contact.phone)
        try {
          const phoneResponse = await makeRequest('https://nubela.co/proxycurl/api/resolve/phone', {
            phone_number: contact.phone
          })
          twitterProfile = phoneResponse.twitter_profile_url
          facebookProfile = phoneResponse.facebook_profile_url
          console.log("Twitter profile found:", twitterProfile)
          console.log("Facebook profile found:", facebookProfile)
        } catch (error) {
          console.error("Error in phone search:", error)
        }
      }

      // Update the contact with the found profiles
      const updatedContact = {
        ...contact,
        linkedin: linkedinProfile || contact.linkedin,
        twitter: twitterProfile || contact.twitter,
        facebook: facebookProfile || contact.facebook
      }

      await updateContact(updatedContact)

      const results = `
        LinkedIn: ${linkedinProfile || 'Not found'}
        Twitter: ${twitterProfile || 'Not found'}
        Facebook: ${facebookProfile || 'Not found'}
      `
      setSocialMediaResults(results)
      toast.success("Social media profiles updated")
    } catch (error) {
      console.error("Error in searchSocialMediaProfiles:", error)
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack)
        toast.error(`Error: ${error.message}`)
      } else {
        console.error("Unexpected error:", error)
        toast.error("An unexpected error occurred")
      }
      setSocialMediaResults("Error occurred while searching for social media profiles. Please check the console for more details.")
    } finally {
      console.log("Social media profile search completed")
      setIsSearchingSocialMedia(false)
    }
  }, [updateContact])

  const handleCheckEmailBreaches = useCallback(async () => {
    if (selectedContact && selectedContact.email) {
      setIsCheckingBreaches(true);
      try {
        console.log("Checking email breaches for:", selectedContact.email);
        
        const response = await fetch('/api/hibp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: selectedContact.email }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HIBP API error: Status ${response.status}`, errorText);
          throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Email breach check result:", data);

        let breachResult = '';
        if (data.message === "No breaches found") {
          breachResult = "No breaches found";
          toast.success("No email breaches found");
        } else {
          // Format the breach data as a comma-separated string of breach names
          breachResult = data.map((breach: { Name: string }) => breach.Name).join(', ');
          toast("Email breaches found. Check the contact details for more information.");
        }

        // Update the contact with the breach result
        const updatedContact = { ...selectedContact, breaches: breachResult };
        const contactRef = doc(db, 'contacts', updatedContact.id);
        
        // Create an object with only the fields to update
        const updateData = { breaches: breachResult };
        
        await updateDoc(contactRef, updateData);

        // Update local state
        setContacts(contacts.map(contact => 
          contact.id === updatedContact.id ? updatedContact : contact
        ));
        setSelectedContact(updatedContact);

      } catch (error) {
        console.error("Error checking email breaches:", error);
        toast.error(`Failed to check email breaches: ${error.message || 'Unknown error'}`);
      } finally {
        setIsCheckingBreaches(false);
      }
    }
  }, [selectedContact, contacts])

  const handleEnrichLinkedInData = useCallback(async () => {
    if (selectedContact && selectedContact.linkedin) {
      setIsEnrichingLinkedIn(true);
      try {
        const response = await fetch('/api/linkedin-enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedinUrl: selectedContact.linkedin }),
        });
        const data = await response.json();
        console.log("LinkedIn data enrichment result:", data);

        // Format certifications
        const formattedCertifications = data.certifications ? formatCertifications(data.certifications) : 'No certifications found';

        // Create an object with all the LinkedIn fields to update
        const updateData = {
          linkedin_headline: data.headline || '',
          linkedin_summary: data.summary || '',
          linkedin_occupation: data.occupation || '',
          linkedin_location: data.location || '',
          linkedin_experience: JSON.stringify(data.experiences || []),
          linkedin_education: JSON.stringify(data.education || []),
          linkedin_skills: data.skills ? data.skills.join(', ') : '',
          linkedin_certifications: formattedCertifications,
          linkedin_projects: JSON.stringify(data.projects || []),
          linkedin_recommendations: JSON.stringify(data.recommendations || []),
          linkedin_activities: JSON.stringify(data.activities || []),
          linkedin_inferred_salary: data.inferred_salary || '',
        };

        // Update the contact with the enriched data
        const updatedContact = {
          ...selectedContact,
          ...updateData
        };

        const contactRef = doc(db, 'contacts', updatedContact.id);
        await updateDoc(contactRef, updateData);

        // Update local state
        setContacts(contacts.map(contact => 
          contact.id === updatedContact.id ? updatedContact : contact
        ));
        setSelectedContact(updatedContact);

        toast.success("LinkedIn data enriched successfully");
      } catch (error) {
        console.error("Error enriching LinkedIn data:", error);
        toast.error("Failed to enrich LinkedIn data");
      } finally {
        setIsEnrichingLinkedIn(false);
      }
    } else {
      toast("No LinkedIn profile URL available for this contact");
    }
  }, [selectedContact, contacts])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error("Error signing out", error)
    }
  }, [signOut, router])

  useEffect(() => {
    if (selectedContact) {
      console.log("Fetching interactions for contact:", selectedContact.id)
      fetchInteractions(selectedContact.id)
    }
  }, [selectedContact, fetchInteractions])

  useEffect(() => {
    console.log("Interactions state updated:", interactions)
  }, [interactions])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileListView(false)
        setIsMobileMenuOpen(false)
      } else {
        setIsMobileListView(true)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleContactsButtonClick = useCallback(() => {
    setIsMobileListView(true);
    setIsMobileMenuOpen(false);
    setSelectedContact(null);
    setIsAddingContact(false);
  }, []);

  const handleContactSelect = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setIsAddingContact(false);
    setIsMobileListView(false);
    setIsMobileAddingContact(false);
  }, []);

  const handleOsintIndustriesSearch = async () => {
    if (!selectedContact?.email) {
      toast.error('Please select a contact with an email address');
      return;
    }

    setIsSearchingOsint(true);
    try {
      const response = await axios.post('/api/osint-industries', { email: selectedContact.email });
      const osintData = response.data;

      console.log('OSINT data received:', osintData); // Add this line for debugging

      // Stringify the OSINT data
      const osintString = JSON.stringify(osintData);

      // Update the contact with OSINT data
      const updatedContact = {
        ...selectedContact,
        osint: osintString
      };

      console.log('Updating contact with:', updatedContact); // Add this line for debugging

      // Update Firestore document
      try {
        await updateDoc(doc(db, 'contacts', selectedContact.id), { osint: osintString });
      } catch (firestoreError) {
        console.error('Firestore update error:', firestoreError);
        throw new Error(`Firestore update failed: ${firestoreError.message}`);
      }

      setSelectedContact(updatedContact);
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === selectedContact.id ? updatedContact : contact
        )
      );
      toast.success('OSINT data retrieved and saved successfully');
    } catch (error) {
      console.error('Error fetching OSINT Industries data:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data);
      }
      toast.error(`Failed to fetch OSINT data: ${error.message}`);
    } finally {
      setIsSearchingOsint(false);
    }
  };

  const handleGlobalInteractionClick = useCallback(() => {
    setIsAddingGlobalInteraction(true);
    setIsMobileListView(false);
    setSelectedContact(null);
    setIsAddingContact(false);
  }, []);

  const exportContactToDocx = useCallback(async (contact: Contact) => {
    const formatValue = (value: any): string => {
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object' && value !== null) return JSON.stringify(value);
      return '';
    };

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Contact Details: ${contact.name}`, bold: true, size: 28 })],
            spacing: { after: 200 }
          }),
        ],
      }],
    });

    contactFieldOrder.forEach((section) => {
      const tableRows = section.fields.map(field => {
        const value = contact[field as keyof Contact];
        if (value !== undefined && value !== null) {
          const formattedValue = formatValue(value);
          return new TableRow({
            children: [
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: field, bold: true })] })],
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: formattedValue })] })],
              }),
            ],
          });
        }
        return null;
      }).filter(Boolean);

      if (tableRows.length > 0) {
        doc.addSection({
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: section.header, bold: true, size: 24 })],
              spacing: { before: 300, after: 200 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
                insideVertical: { style: BorderStyle.NONE },
              },
            }),
          ],
        });
      }
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${contact.name}_contact_details.docx`);
    });
  }, [contactFieldOrder]);

  // Add this function near the top of the component, with other handler functions
  const handleTidyText = async () => {
    if (!selectedContact.otherInsights) {
      toast.error('No text to tidy');
      return;
    }

    try {
      const response = await axios.post('/api/tidy-text', {
        text: selectedContact.otherInsights
      });

      if (response.data.success) {
        const updatedContact = {
          ...selectedContact,
          otherInsights: response.data.tidiedText
        };
        updateContact(updatedContact);
        setSelectedContact(updatedContact);
        toast.success('Text tidied successfully');
      } else {
        throw new Error(response.data.error || 'Failed to tidy text');
      }
    } catch (error) {
      console.error('Error tidying text:', error);
      toast.error('Failed to tidy text');
    }
  };

  if (loading || !isClient) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <SignIn />
  }

  console.log("Home component rendering");

  const getAvatarSrc = (contact: Contact) => {
    if (contact.avatar) return contact.avatar;
    if (contact.linkedin_profile_pic_url) return contact.linkedin_profile_pic_url;
    // Use strict equality and ensure the gender is lowercase
    return contact.gender?.toLowerCase() === 'female' 
      ? '/images/placeholder-user-female.jpg' 
      : '/images/placeholder-user-male.jpg';
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-100 relative"> {/* Added relative positioning */}
        {/* Main Menu - visible only on desktop */}
        <div className="hidden md:flex w-16 bg-white border-r flex-col items-center py-4">
          <Button variant="ghost" className="mb-4" onClick={handleContactsButtonClick}>
            <Users className="h-6 w-6" />
          </Button>
          <Button variant="ghost" className="mb-4" onClick={handleGlobalInteractionClick}>
            <Calendar className="h-6 w-6" />
          </Button>
          {/* <Button variant="ghost" className="mb-4" onClick={handleAddReminder}>
            <Bell className="h-6 w-6" />
          </Button> */}
          <Button variant="ghost" className="mb-4" onClick={() => router.push('/all-reminders')}>
            <Bell className="h-6 w-6" />
          </Button>
          {/* Add the Upload Chat Log button here */}
          <Button variant="ghost" className="mb-4" onClick={() => setIsUploadingChatLog(true)}>
            <Upload className="h-6 w-6" />
          </Button>
          <div className="flex-grow" />
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-6 w-6" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Contact List */}
          <div className={`w-full md:w-1/3 bg-white border-r flex flex-col h-full ${(isAddingContact || selectedContact) && !isMobileListView ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex-shrink-0 p-4 border-b">
              <Input 
                type="text" 
                placeholder="Search contacts..." 
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0 flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">All contacts</h2>
              <Button size="sm" onClick={handleAddContact}><Plus className="w-4 h-4 mr-2" /> Add new contact</Button>
            </div>
            {/* ScrollArea for better cross-platform scrolling behavior */}
            <ScrollArea className="flex-grow">
              <div className="pb-20 md:pb-0"> {/* Add padding at the bottom for mobile */}
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center p-4 hover:bg-gray-100 cursor-pointer ${
                      selectedContact?.id === contact.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarContact(contact.id);
                      }}
                    >
                      <Star 
                        className={`h-6 w-6 ${
                          contact.starred ? 'text-yellow-400' : 'text-gray-300'
                        }`} 
                      />
                    </Button>
                    <Avatar className="h-10 w-10 ml-2">
                      <AvatarImage src={getAvatarSrc(contact)} alt={contact.name} />
                      <AvatarFallback>{contact.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 flex-grow">
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.relationship}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteContact(contact.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Contact details or Add Contact form or Global Interaction form */}
          <div className={`w-full md:w-2/3 flex-col h-full overflow-y-auto relative ${!isMobileListView || isMobileAddingContact || isAddingGlobalInteraction ? 'block' : 'hidden md:block'}`}>
            <div className="p-6 pb-28 md:pb-6">
              {isAddingContact ? (
                <div className="fixed inset-0 bg-white z-50 overflow-y-auto md:relative md:inset-auto">
                  <AddContactForm
                    onAddContact={handleAddNewContact}
                    onCancel={handleCancelAddContact}
                  />
                </div>
              ) : isAddingGlobalInteraction ? (
                <GlobalAddInteractionForm
                  contacts={contacts}
                  onInteractionAdded={() => {
                    setIsAddingGlobalInteraction(false);
                  }}
                  onCancel={() => setIsAddingGlobalInteraction(false)}
                />
              ) : selectedContact ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center mb-6">
                    <div className="relative h-20 w-20 mr-4">
                      <Image
                        src={getAvatarSrc(selectedContact)}
                        alt={selectedContact.name || 'Contact'}
                        width={80}
                        height={80}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
                      <p className="text-gray-500">{selectedContact.relationship}</p>
                    </div>
                  </div>
                  
                  {isEditing && editedContact ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4" onClick={(e) => e.stopPropagation()}>
                      {contactFieldOrder.map((section) => (
                        <div key={section.header} className="mb-6">
                          <h3 className="font-bold text-lg mb-2">{section.header}</h3>
                          {section.fields.map((key) => (
                            <div key={key} className="mb-4">
                              <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                {key.replace(/_/g, ' ')}
                              </label>
                              {key === 'gender' ? (
                                <select
                                  id={key}
                                  value={editedContact[key as keyof Contact] || ''}
                                  onChange={(e) => setEditedContact({ ...editedContact, [key]: e.target.value as 'male' | 'female' | 'other' })}
                                  className="w-full p-2 border rounded"
                                >
                                  <option value="">Select Gender</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="other">Other</option>
                                </select>
                              ) : (
                                <Input
                                  id={key}
                                  value={editedContact[key as keyof Contact] || ''}
                                  onChange={(e) => setEditedContact({ ...editedContact, [key]: e.target.value })}
                                  className="w-full"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                      <div className="flex justify-end space-x-2">
                        <Button type="submit" onClick={(e) => e.stopPropagation()}>Save Changes</Button>
                        <Button onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} variant="outline">Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {contactFieldOrder.map((section) => {
                        const populatedFields = section.fields.filter(key => 
                          selectedContact[key as keyof Contact] !== undefined && 
                          selectedContact[key as keyof Contact] !== null &&
                          selectedContact[key as keyof Contact] !== ''
                        );
                        
                        if (populatedFields.length === 0) return null;

                        return (
                          <div key={section.header} className="mb-6">
                            <h3 className="font-bold text-lg mb-2">{section.header}</h3>
                            {populatedFields.map((key) => {
                              const value = selectedContact[key as keyof Contact];
                              return (
                                <div key={key} className="mb-4">
                                  <h4 className="font-semibold mb-1 capitalize">{key.replace(/_/g, ' ')}</h4>
                                  <div>{formatValue(key, value)}</div>
                                  {key === 'otherInsights' && (
                                    <Button
                                      onClick={handleTidyText}
                                      className="mt-2 w-auto bg-black text-white hover:bg-gray-800"
                                      size="sm"
                                    >
                                      Tidy Text
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                      <Button onClick={(e) => { e.stopPropagation(); handleEditContact(); }}>Edit Contact</Button>
                    </>
                  )}
                  
                  <div className="mt-6 flex flex-wrap items-center space-x-2 space-y-2">
                    <Button onClick={handleAddInteraction} variant="outline">Add Interaction</Button>
                    <Button 
                      onClick={() => setIsMobileListView(true)}
                      variant="outline"
                      className="md:hidden"
                    >
                      Back to List
                    </Button>
                  </div>
                  {isAddingInteraction && (
                    <AddInteractionForm
                      contactId={selectedContact.id}
                      onInteractionAdded={handleInteractionAdded}
                      onCancel={() => setIsAddingInteraction(false)}
                    />
                  )}
                  {/* Interactions section */}
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Interactions</h3>
                    {interactions.length > 0 ? (
                      <div className="space-y-2">
                        {interactions.map((interaction) => (
                          <InteractionTile key={interaction.id} interaction={interaction} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No interactions found for this contact.</p>
                    )}
                  </div>

                  {/* Social Media, Email Breaches, and LinkedIn Data buttons in a row */}
                  <div className="mt-4 flex flex-row space-x-2">
                    <Button 
                      onClick={() => selectedContact && searchSocialMediaProfiles(selectedContact)} 
                      variant="secondary"
                      className="flex-1 bg-black text-white hover:bg-gray-800"
                      disabled={isSearchingSocialMedia || !selectedContact.name}
                    >
                      {isSearchingSocialMedia ? 'Searching...' : 'Search Social Media Profiles'}
                    </Button>
                    <Button 
                      onClick={() => selectedContact?.email && handleCheckEmailBreaches()} 
                      variant="secondary"
                      className="flex-1 bg-black text-white hover:bg-gray-800"
                      disabled={isCheckingBreaches || !selectedContact.email}
                    >
                      {isCheckingBreaches ? 'Checking...' : 'Check Email Breaches'}
                    </Button>
                    <Button 
                      onClick={() => selectedContact?.linkedin && handleEnrichLinkedInData()} 
                      variant="secondary"
                      className="flex-1 bg-black text-white hover:bg-gray-800"
                      disabled={isEnrichingLinkedIn || !selectedContact.linkedin}
                    >
                      {isEnrichingLinkedIn ? 'Enriching...' : 'Enrich LinkedIn Data'}
                    </Button>
                    <Button 
                      onClick={handleOsintIndustriesSearch} 
                      variant="secondary"
                      className="flex-1 bg-black text-white hover:bg-gray-800"
                      disabled={isSearchingOsint || !selectedContact?.email}
                    >
                      {isSearchingOsint ? 'Searching...' : 'OSINT Industries Search'}
                    </Button>
                  </div>

                  {selectedContact && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Reminders</h3>
                      {reminders.length > 0 ? (
                        <div className="space-y-2">
                          {reminders.map((reminder) => (
                            <div key={reminder.id} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
                              <div className={reminder.isCompleted ? 'line-through text-gray-500' : ''}>
                                <div className="font-semibold">{reminder.title}</div>
                                <div className="text-sm text-gray-500">{new Date(reminder.date).toLocaleDateString()}</div>
                                <div className="text-sm">{reminder.description}</div>
                              </div>
                              <Button
                                onClick={() => handleReminderCompletion(reminder.id, !reminder.isCompleted)}
                                variant="ghost"
                                size="icon"
                                className={reminder.isCompleted ? "text-green-500 hover:text-green-600" : "text-gray-500 hover:text-gray-600"}
                              >
                                {reminder.isCompleted ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No reminders for this contact.</p>
                      )}
                      <Button onClick={handleAddReminder} className="mt-2">Add Reminder</Button>
                    </div>
                  )}
                  <Button 
                    onClick={() => exportContactToDocx(selectedContact)}
                    className="mt-4"
                  >
                    Export as DOCX
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Select a contact to view details or add an interaction</p>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none md:hidden"></div>
          </div>
        </div>

        {/* Mobile Menu - visible only on mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white bg-opacity-90 border-t flex justify-around py-1 z-10"> {/* Changed py-2 to py-1 and added bg-opacity-90 */}
          <Button variant="ghost" onClick={handleContactsButtonClick}>
            <Users className="h-6 w-6" />
          </Button>
          <Button variant="ghost" onClick={handleGlobalInteractionClick}>
            <Calendar className="h-6 w-6" />
          </Button>
          {/* <Button variant="ghost" onClick={handleAddReminder}>
            <Bell className="h-6 w-6" />
          </Button> */}
          <Button variant="ghost" onClick={() => router.push('/all-reminders')}>
            <Bell className="h-6 w-6" />
          </Button>
          {/* Add the Upload Chat Log button here */}
          <Button variant="ghost" onClick={() => setIsUploadingChatLog(true)}>
            <Upload className="h-6 w-6" />
          </Button>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-6 w-6" />
          </Button>
        </div>

        {/* ReminderForm Modal */}
        {isAddingReminder && selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <ReminderForm
                contactId={selectedContact.id}
                onReminderAdded={handleReminderAdded}
                onCancel={() => {
                  setIsAddingReminder(false);
                }}
              />
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          message="Are you sure you want to delete this contact? This action cannot be undone."
        />

        {isUploadingChatLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <UploadChatLog onClose={() => setIsUploadingChatLog(false)} />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

// Add this new component at the end of the file
function GlobalAddInteractionForm({ contacts, onInteractionAdded, onCancel }: { 
  contacts: Contact[], 
  onInteractionAdded: () => void, 
  onCancel: () => void 
}) {
  const [selectedContactId, setSelectedContactId] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) {
      toast.error('Please select a contact');
      return;
    }
    setIsProcessing(true);
    try {
      // First, add the interaction
      await addDoc(collection(db, 'interactions'), {
        contactId: selectedContactId,
        date,
        type,
        notes,
        createdAt: new Date()
      });

      // Then, process the interaction with AI
      const aiResponse = await axios.post('/api/process-interaction', { interaction: notes });
      const { updatedInfo, potentialReminders } = aiResponse.data;

      // Get the current contact data
      const contactRef = doc(db, 'contacts', selectedContactId);
      const contactSnap = await getDoc(contactRef);
      
      if (contactSnap.exists()) {
        const currentContactData = contactSnap.data();
        
        // Update the merging logic to exclude certain fields and add General Insights
        const fieldsToExclude = ['name', 'relationship', 'gender', 'email', 'phone'];
        const mergedData = Object.entries(updatedInfo).reduce((acc, [key, value]) => {
          if (!fieldsToExclude.includes(key) && value !== null && value !== undefined && value !== '') {
            if (key === 'generalInsights') {
              // For General Insights, always append
              acc[key] = acc[key] ? `${acc[key]}. ${value}` : value;
            } else if (currentContactData[key]) {
              // Append new information to existing data for other fields
              acc[key] = `${currentContactData[key]}. ${value}`;
            } else {
              // For new fields, just use the new value
              acc[key] = value;
            }
          }
          return acc;
        }, {...currentContactData});

        // Update the contact with the merged information
        await updateDoc(contactRef, mergedData);

        // If there are potential reminders, add them to the reminders collection
        if (potentialReminders && potentialReminders.length > 0) {
          for (const reminder of potentialReminders) {
            await addDoc(collection(db, 'reminders'), {
              contactId: selectedContactId,
              title: reminder.title,
              description: reminder.description,
              date: reminder.date,
              isCompleted: false,
              createdAt: new Date()
            });
          }
          toast.success(`${potentialReminders.length} reminder(s) added automatically`);
        }
      } else {
        console.error("Contact does not exist");
        toast.error('Failed to update contact: Contact not found');
        return;
      }

      onInteractionAdded();
      toast.success('Interaction added and contact updated');
    } catch (error) {
      console.error("Error adding interaction: ", error);
      toast.error('Failed to add interaction');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4 fixed inset-0 bg-white p-4 z-50 overflow-auto" // Added fixed positioning and z-index
    >
      <h3 className="text-lg font-semibold">Add Interaction</h3>
      <div>
        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
          Select Contact
        </label>
        <select
          id="contact"
          value={selectedContactId}
          onChange={(e) => setSelectedContactId(e.target.value)}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select a contact</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </select>
      </div>
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <Input
        placeholder="Interaction type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        required
      />
      <Input
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        required
      />
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Add Interaction'}
        </Button>
        <Button onClick={onCancel} variant="outline" disabled={isProcessing}>Cancel</Button>
      </div>
    </form>
  );
}

// Add this at the end of the file, outside of the Home component
function InteractionTile({ interaction }: { interaction: Interaction }) {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="font-semibold text-lg mb-2">{interaction.type}</div>
      <div className="text-sm text-gray-500 mb-2">Date: {new Date(interaction.date).toLocaleDateString()}</div>
      <div className="text-sm">{interaction.notes}</div>
    </div>
  )
}