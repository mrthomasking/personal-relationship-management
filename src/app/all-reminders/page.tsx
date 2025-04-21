'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { collection, query, getDocs, updateDoc, doc, orderBy, limit, where, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Calendar, CalendarClock, LogOut, Check, Plus, FileText, UserPlus, Bell, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MobileNavBar } from '@/components/MobileNavBar'

interface Reminder {
  id: string
  title: string
  description: string
  date: string
  contactId: string
  isCompleted: boolean
}

interface Contact {
  id: string
  name: string
}

export default function AllReminders() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isAddingReminder, setIsAddingReminder] = useState(false)
  const [newReminder, setNewReminder] = useState<Omit<Reminder, 'id' | 'isCompleted'>>({
    title: '',
    description: '',
    date: '',
    contactId: ''
  })
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  const REMINDERS_PER_PAGE = 20;

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reminders]);

  useEffect(() => {
    const fetchReminders = async () => {
      if (!user) return
      try {
        const q = query(
          collection(db, 'reminders'),
          where('isCompleted', '==', false),
          orderBy('date', 'asc'),
          limit(REMINDERS_PER_PAGE)
        )
        const querySnapshot = await getDocs(q)
        const fetchedReminders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder))
        
        setReminders(fetchedReminders)
        console.log("Fetched reminders:", fetchedReminders)
      } catch (error) {
        console.error("Error fetching reminders:", error)
        toast.error("Failed to fetch reminders")
      }
    }

    const fetchContacts = async () => {
      if (!user) return
      try {
        const q = query(collection(db, 'contacts'), where('userId', '==', user.uid))
        const querySnapshot = await getDocs(q)
        const fetchedContacts = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Contact))
        setContacts(fetchedContacts)
      } catch (error) {
        console.error("Error fetching contacts:", error)
        toast.error("Failed to fetch contacts")
      }
    }

    if (user) {
      fetchReminders()
      fetchContacts()
    }
  }, [user])

  const handleToggleReminder = async (reminderId: string, currentStatus: boolean) => {
    try {
      const reminderRef = doc(db, 'reminders', reminderId)
      await updateDoc(reminderRef, { isCompleted: !currentStatus })
      
      // Remove the completed reminder from the list
      if (!currentStatus) {
        setReminders(reminders.filter(reminder => reminder.id !== reminderId))
      } else {
        setReminders(reminders.map(reminder => 
          reminder.id === reminderId ? { ...reminder, isCompleted: !currentStatus } : reminder
        ))
      }
      
      toast.success(`Reminder marked as ${!currentStatus ? 'completed' : 'incomplete'}`)
    } catch (error) {
      console.error("Error updating reminder:", error)
      toast.error("Failed to update reminder")
    }
  }

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReminder.contactId) {
      toast.error("Please select a contact")
      return
    }
    try {
      const docRef = await addDoc(collection(db, 'reminders'), {
        ...newReminder,
        isCompleted: false
      })
      const addedReminder = { id: docRef.id, ...newReminder, isCompleted: false }
      setReminders([...reminders, addedReminder])
      setIsAddingReminder(false)
      setNewReminder({ title: '', description: '', date: '', contactId: '' })
      toast.success("Reminder added successfully")
    } catch (error) {
      console.error("Error adding reminder:", error)
      toast.error("Failed to add reminder")
    }
  }

  const handleEditReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReminder) return
    
    try {
      const reminderRef = doc(db, 'reminders', editingReminder.id)
      const updateData = {
        title: editingReminder.title,
        description: editingReminder.description,
        date: editingReminder.date,
        contactId: editingReminder.contactId
      }
      
      await updateDoc(reminderRef, updateData)
      
      // Update the reminders list
      setReminders(reminders.map(reminder => 
        reminder.id === editingReminder.id ? editingReminder : reminder
      ))
      
      setEditingReminder(null)
      toast.success("Reminder updated successfully")
    } catch (error) {
      console.error("Error updating reminder:", error)
      toast.error("Failed to update reminder")
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in to view reminders</div>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Menu - visible only on desktop - matching the contact list page */}
      <div className="hidden md:flex w-16 bg-white border-r flex-col items-center py-4">
        <Button variant="ghost" className="mb-4" onClick={() => router.push('/')}>
          <Users className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="mb-4" onClick={() => router.push('/')}>
          <Calendar className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="mb-4" onClick={() => router.push('/all-reminders')}>
          <Bell className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="mb-4">
          <Upload className="h-6 w-6" />
        </Button>
        <div className="flex-grow" />
        <Button variant="ghost" onClick={handleSignOut}>
          <LogOut className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Active Reminders</h1>
          <Link href="/">
            <Button className="mb-4">Back to Contacts</Button>
          </Link>
          <Button onClick={() => setIsAddingReminder(true)} className="mb-4 ml-2">
            <Plus className="h-4 w-4 mr-2" /> Add Reminder
          </Button>
          {isAddingReminder && (
            <form onSubmit={handleAddReminder} className="mb-4 p-4 bg-white rounded-lg shadow">
              <Input
                placeholder="Title"
                value={newReminder.title}
                onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                className="mb-2"
                required
              />
              <Input
                placeholder="Description"
                value={newReminder.description}
                onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                className="mb-2"
              />
              <Input
                type="date"
                value={newReminder.date}
                onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                className="mb-2"
                required
              />
              <select
                value={newReminder.contactId}
                onChange={(e) => setNewReminder({...newReminder, contactId: e.target.value})}
                className="w-full p-2 border rounded mb-2"
                required
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end">
                <Button type="submit" className="mr-2">Add Reminder</Button>
                <Button variant="outline" onClick={() => setIsAddingReminder(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {editingReminder && (
            <form onSubmit={handleEditReminder} className="mb-4 p-4 bg-white rounded-lg shadow">
              <h3 className="font-semibold mb-2">Edit Reminder</h3>
              <Input
                placeholder="Title"
                value={editingReminder.title}
                onChange={(e) => setEditingReminder({...editingReminder, title: e.target.value})}
                className="mb-2"
                required
              />
              <Input
                placeholder="Description"
                value={editingReminder.description}
                onChange={(e) => setEditingReminder({...editingReminder, description: e.target.value})}
                className="mb-2"
              />
              <Input
                type="date"
                value={editingReminder.date}
                onChange={(e) => setEditingReminder({...editingReminder, date: e.target.value})}
                className="mb-2"
                required
              />
              <select
                value={editingReminder.contactId}
                onChange={(e) => setEditingReminder({...editingReminder, contactId: e.target.value})}
                className="w-full p-2 border rounded mb-2"
                required
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end">
                <Button type="submit" className="mr-2">Update Reminder</Button>
                <Button variant="outline" onClick={() => setEditingReminder(null)}>Cancel</Button>
              </div>
            </form>
          )}

          <ScrollArea className="h-[calc(100vh-200px)]">
            {reminders.length === 0 ? (
              <p>No active reminders found.</p>
            ) : (
              <div className="space-y-4">
                {sortedReminders.map(reminder => {
                  // Find the contact for this reminder
                  const contact = contacts.find(c => c.id === reminder.contactId);
                  const contactName = contact ? contact.name : 'Unknown Contact';
                  
                  return (
                    <div key={reminder.id} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
                      <div className="flex-grow pr-4">
                        <h3 className="font-semibold">{reminder.title}</h3>
                        <p>{reminder.description}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-sm text-gray-500">{new Date(reminder.date).toLocaleDateString()}</p>
                          <p className="text-sm font-medium text-blue-600">For: {contactName}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setEditingReminder(reminder)}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                          title="Edit Reminder"
                        >
                          Edit
                        </Button>
                        <Button 
                          onClick={() => handleToggleReminder(reminder.id, reminder.isCompleted)}
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0"
                          title="Mark as Complete"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
      
      {/* Replace the mobile menu bar with the MobileNavBar component */}
      <MobileNavBar 
        currentPage="reminders"
        onShowContactsList={() => router.push('/')}
        onGlobalInteraction={() => router.push('/')}
        onAddContact={() => router.push('/')}
        onUploadChatLog={() => {}}
        onSignOut={handleSignOut}
      />
    </div>
  )
}