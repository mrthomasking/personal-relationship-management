'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Plus, Search } from 'lucide-react'

interface Contact {
  id: string
  name: string
  relationship: string
  avatar: string
  email: string
  phone: string
  birthday: string
  notes: string
}

const contacts: Contact[] = [
  { id: '1', name: 'Adrian Tan', relationship: 'Friend', avatar: '/placeholder-user.jpg', email: 'adrian.tan@example.com', phone: '+1 (555) 123-4567', birthday: '1990-05-15', notes: 'Met at university. Likes hiking and photography.' },
  { id: '2', name: 'John Doe', relationship: 'Colleague', avatar: '/placeholder-user.jpg', email: 'john.doe@example.com', phone: '+1 (555) 987-6543', birthday: '1985-11-22', notes: 'Works in the marketing department. Coffee enthusiast.' },
  { id: '3', name: 'Jane Smith', relationship: 'Family', avatar: '/placeholder-user.jpg', email: 'jane.smith@example.com', phone: '+1 (555) 246-8135', birthday: '1992-03-30', notes: 'Cousin. Passionate about cooking and travel.' },
]

export function Page() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.relationship.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-4">
          <h1 className="text-2xl font-bold">PersonalRM</h1>
        </div>
        <nav className="mt-4">
          <a href="#" className="block px-4 py-2 text-blue-600 bg-blue-100">Contacts</a>
          <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Events</a>
          <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Notes</a>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Contact list */}
        <div className="w-1/3 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <Input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">All contacts</h2>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add new contact</Button>
          </div>
          <div className="flex-1 overflow-y-auto"> {/* Ensure this div is scrollable */}
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center p-4 hover:bg-gray-100 cursor-pointer"
                onClick={() => setSelectedContact(contact)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                  <AvatarFallback>{contact.name[0]}</AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-gray-500">{contact.relationship}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact details */}
        {selectedContact ? (
          <div className="flex-1 p-6">
            <div className="flex items-center mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
                <p className="text-gray-500">{selectedContact.relationship}</p>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <p className="text-sm text-gray-500">Email: {selectedContact.email}</p>
                <p className="text-sm text-gray-500">Phone: {selectedContact.phone}</p>
                <p className="text-sm text-gray-500">Birthday: {selectedContact.birthday}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-gray-500">{selectedContact.notes}</p>
              </div>
            </div>
            <div className="mt-6">
              <Button className="mr-2">Edit Contact</Button>
              <Button variant="outline">Add Interaction</Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a contact to view details
          </div>
        )}
      </div>
    </div>
  )
}