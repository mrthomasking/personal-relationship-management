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
      {/* Main Menu - visible only on desktop */}
      <div className="hidden md:flex w-16 bg-white border-r flex-col items-center py-4">
        <Button variant="ghost" className="mb-4" onClick={() => router.push('/')}>
          <Users className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="mb-4">
          <Calendar className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="mb-4">
          <CalendarClock className="h-6 w-6" />
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
          <ScrollArea className="h-[calc(100vh-200px)]">
            {reminders.length === 0 ? (
              <p>No active reminders found.</p>
            ) : (
              <div className="space-y-4">
                {sortedReminders.map(reminder => (
                  <div key={reminder.id} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
                    <div className="flex-grow pr-4">
                      <h3 className="font-semibold">{reminder.title}</h3>
                      <p>{reminder.description}</p>
                      <p className="text-sm text-gray-500">{new Date(reminder.date).toLocaleDateString()}</p>
                    </div>
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
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
      
      {/* Mobile menu bar with icons only - no captions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 md:hidden z-50 flex justify-around mobile-nav">
        <Button variant="ghost" className="flex flex-col items-center" onClick={() => router.push('/')}>
          <Users className="h-6 w-6" />
        </Button>
        
        <Button variant="ghost" className="flex flex-col items-center" onClick={() => router.push('/')}>
          <UserPlus className="h-6 w-6" />
        </Button>
        
        <Button variant="ghost" className="flex flex-col items-center" onClick={() => router.push('/')}>
          <FileText className="h-6 w-6" />
        </Button>
        
        <Button variant="ghost" className="flex flex-col items-center" onClick={() => router.push('/all-reminders')}>
          <Bell className="h-6 w-6" />
        </Button>
        
        <Button variant="ghost" className="flex flex-col items-center" onClick={() => router.push('/')}>
          <Upload className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
} 