'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { collection, query, getDocs, doc, orderBy, limit, where, addDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Calendar, Bell, LogOut, Upload, Plus, Edit, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MobileNavBar } from '@/components/MobileNavBar'

interface Interaction {
  id: string
  contactId: string
  date: string
  type: string
  notes: string
  createdAt: Date
}

interface Contact {
  id: string
  name: string
}

export default function AllInteractions() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingInteraction, setIsAddingInteraction] = useState(false)
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null)
  const [newInteraction, setNewInteraction] = useState<Omit<Interaction, 'id' | 'createdAt'>>({
    contactId: '',
    date: new Date().toISOString().split('T')[0],
    type: '',
    notes: ''
  })

  const INTERACTIONS_PER_PAGE = 50;

  const sortedInteractions = useMemo(() => {
    return [...interactions].sort((a, b) => {
      // Sort by date in descending order (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [interactions]);

  const filteredInteractions = useMemo(() => {
    if (!searchTerm) return sortedInteractions;
    
    return sortedInteractions.filter(interaction => {
      const contact = contacts.find(c => c.id === interaction.contactId);
      const contactName = contact ? contact.name.toLowerCase() : '';
      
      return (
        interaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interaction.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contactName.includes(searchTerm.toLowerCase())
      );
    });
  }, [sortedInteractions, contacts, searchTerm]);

  useEffect(() => {
    const fetchInteractions = async () => {
      if (!user) return
      try {
        const q = query(
          collection(db, 'interactions'),
          orderBy('date', 'desc'),
          limit(INTERACTIONS_PER_PAGE)
        )
        const querySnapshot = await getDocs(q)
        const fetchedInteractions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interaction))
        
        setInteractions(fetchedInteractions)
        console.log("Fetched interactions:", fetchedInteractions)
      } catch (error) {
        console.error("Error fetching interactions:", error)
        toast.error("Failed to fetch interactions")
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
      fetchInteractions()
      fetchContacts()
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInteraction.contactId) {
      toast.error("Please select a contact")
      return
    }
    try {
      const docRef = await addDoc(collection(db, 'interactions'), {
        ...newInteraction,
        createdAt: new Date()
      })
      const addedInteraction = { 
        id: docRef.id, 
        ...newInteraction, 
        createdAt: new Date() 
      } as Interaction
      
      setInteractions([addedInteraction, ...interactions])
      setIsAddingInteraction(false)
      setNewInteraction({ 
        contactId: '', 
        date: new Date().toISOString().split('T')[0], 
        type: '', 
        notes: '' 
      })
      toast.success("Interaction added successfully")
    } catch (error) {
      console.error("Error adding interaction:", error)
      toast.error("Failed to add interaction")
    }
  }

  const handleEditInteraction = (interaction: Interaction) => {
    setEditingInteraction(interaction)
    setIsAddingInteraction(false)
  }

  const handleUpdateInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingInteraction) return
    
    try {
      const interactionRef = doc(db, 'interactions', editingInteraction.id)
      const updateData = {
        contactId: editingInteraction.contactId,
        date: editingInteraction.date,
        type: editingInteraction.type,
        notes: editingInteraction.notes
      }
      
      await updateDoc(interactionRef, updateData)
      
      // Update the interactions list
      setInteractions(interactions.map(interaction => 
        interaction.id === editingInteraction.id ? editingInteraction : interaction
      ))
      
      setEditingInteraction(null)
      toast.success("Interaction updated successfully")
    } catch (error) {
      console.error("Error updating interaction:", error)
      toast.error("Failed to update interaction")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in to view interactions</div>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Menu - visible only on desktop - matching the contact list page */}
      <div className="hidden md:flex w-16 bg-white border-r flex-col items-center py-4">
        <Button variant="ghost" className="mb-4" onClick={() => router.push('/')}>
          <Users className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="mb-4" onClick={() => router.push('/all-interactions')}>
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
          <h1 className="text-2xl font-bold mb-4">All Interactions</h1>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <Link href="/">
              <Button className="w-full md:w-auto">Back to Contacts</Button>
            </Link>
            <Button 
              onClick={() => setIsAddingInteraction(true)} 
              className="w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Interaction
            </Button>
            <Input
              placeholder="Search interactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64"
            />
          </div>

          {isAddingInteraction && (
            <form onSubmit={handleAddInteraction} className="mb-4 p-4 bg-white rounded-lg shadow">
              <h3 className="font-semibold mb-2">Add New Interaction</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact</label>
                  <select
                    value={newInteraction.contactId}
                    onChange={(e) => setNewInteraction({...newInteraction, contactId: e.target.value})}
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={newInteraction.date}
                    onChange={(e) => setNewInteraction({...newInteraction, date: e.target.value})}
                    className="mb-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Input
                    placeholder="e.g., Phone Call, Meeting, Email"
                    value={newInteraction.type}
                    onChange={(e) => setNewInteraction({...newInteraction, type: e.target.value})}
                    className="mb-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    placeholder="Details about the interaction"
                    value={newInteraction.notes}
                    onChange={(e) => setNewInteraction({...newInteraction, notes: e.target.value})}
                    className="w-full p-2 border rounded mb-2 min-h-[100px]"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button type="submit">Add Interaction</Button>
                <Button variant="outline" onClick={() => setIsAddingInteraction(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {editingInteraction && (
            <form onSubmit={handleUpdateInteraction} className="mb-4 p-4 bg-white rounded-lg shadow">
              <h3 className="font-semibold mb-2">Edit Interaction</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact</label>
                  <select
                    value={editingInteraction.contactId}
                    onChange={(e) => setEditingInteraction({...editingInteraction, contactId: e.target.value})}
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={editingInteraction.date}
                    onChange={(e) => setEditingInteraction({...editingInteraction, date: e.target.value})}
                    className="mb-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Input
                    placeholder="e.g., Phone Call, Meeting, Email"
                    value={editingInteraction.type}
                    onChange={(e) => setEditingInteraction({...editingInteraction, type: e.target.value})}
                    className="mb-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    placeholder="Details about the interaction"
                    value={editingInteraction.notes}
                    onChange={(e) => setEditingInteraction({...editingInteraction, notes: e.target.value})}
                    className="w-full p-2 border rounded mb-2 min-h-[100px]"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button type="submit">Update Interaction</Button>
                <Button variant="outline" onClick={() => setEditingInteraction(null)}>Cancel</Button>
              </div>
            </form>
          )}

          <ScrollArea className="h-[calc(100vh-200px)]">
            {filteredInteractions.length === 0 ? (
              <p>No interactions found.</p>
            ) : (
              <div className="space-y-4">
                {filteredInteractions.map(interaction => {
                  // Find the contact for this interaction
                  const contact = contacts.find(c => c.id === interaction.contactId);
                  const contactName = contact ? contact.name : 'Unknown Contact';
                  
                  return (
                    <div key={interaction.id} className="bg-white shadow rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-md">{interaction.type}</div>
                        <div className="text-sm text-gray-500">{new Date(interaction.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-gray-700 whitespace-pre-line text-sm mb-2">{interaction.notes}</div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-blue-600">Contact: {contactName}</div>
                        <Button 
                          onClick={() => handleEditInteraction(interaction)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-blue-500"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
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
        currentPage="interactions"
        onShowContactsList={() => router.push('/')}
        onGlobalInteraction={() => setIsAddingInteraction(true)}
        onAddContact={() => router.push('/')}
        onUploadChatLog={() => {}}
        onSignOut={handleSignOut}
      />
    </div>
  )
} 