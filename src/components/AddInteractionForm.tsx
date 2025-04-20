import React, { useState, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { MainMenu } from './MainMenu'
import { useContact } from '@/lib/hooks/useContact'

interface AddInteractionFormProps {
  contactId: string
  onInteractionAdded: () => void
  onCancel: () => void
}

interface Contact {
  [key: string]: any;
}

export const AddInteractionForm = React.memo(({ contactId, onInteractionAdded, onCancel }: AddInteractionFormProps) => {
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { contact, updateContact } = useContact(contactId)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      // Add the interaction
      await addDoc(collection(db, 'interactions'), {
        contactId,
        date,
        type,
        notes,
        createdAt: new Date()
      })

      // Process the interaction with AI
      const response = await axios.post('/api/process-interaction', { interaction: notes })
      console.log("API response:", response.data);
      const { updatedInfo, potentialReminders } = response.data

      // Update contact info
      if (contact) {
        console.log("Current contact:", contact);
        const fieldsToExclude = ['name', 'relationship', 'gender', 'email', 'phone'];
        const mergedData = Object.entries(updatedInfo).reduce((acc: Contact, [key, value]) => {
          if (!fieldsToExclude.includes(key) && value) {
            if (key === 'likes') {
              // Handle likes as an array
              acc[key] = Array.isArray(acc[key])
                ? Array.from(new Set([...acc[key], ...(Array.isArray(value) ? value : [value])]))
                : Array.isArray(value) ? value : [value];
            } else if (['personality_traits', 'friends', 'enemies', 'acquaintances', 'family', 'wants', 'ambition', 'dislikes', 'commitments'].includes(key)) {
              // For array-like fields, concatenate with comma separation
              acc[key] = acc[key] 
                ? Array.from(new Set([...acc[key].split(', '), ...(Array.isArray(value) ? value : [value])])).join(', ')
                : Array.isArray(value) ? value.join(', ') : value;
            } else if (key === 'otherInsights') {
              // Append other insights
              acc[key] = acc[key] ? `${acc[key]}; ${value}` : value;
            } else {
              // For other fields, update if empty or append if exists
              acc[key] = acc[key] ? `${acc[key]}; ${value}` : value;
            }
          }
          return acc;
        }, {...contact as Contact});

        console.log("Merged data:", mergedData);
        await updateContact(mergedData)
      } else {
        console.log("Contact is null, cannot update");
      }

      // Add potential reminders
      if (Array.isArray(potentialReminders) && potentialReminders.length > 0) {
        const reminderPromises = potentialReminders.map((reminder: any) => {
          const reminderData = {
            contactId,
            title: reminder.reminder || 'Untitled Reminder',
            description: reminder.description || reminder.reminder || '',
            date: reminder.date || new Date().toISOString().split('T')[0],
            isCompleted: false,
            createdAt: new Date()
          };
          console.log("Adding reminder:", reminderData);
          if (!reminderData.title) {
            console.warn("Reminder title is empty, skipping this reminder");
            return null;
          }
          return addDoc(collection(db, 'reminders'), reminderData);
        }).filter(Boolean); // Remove null promises
        
        if (reminderPromises.length > 0) {
          await Promise.all(reminderPromises);
          toast.success(`${reminderPromises.length} reminder(s) added automatically`);
        } else {
          console.log("No valid reminders to add");
        }
      } else {
        console.log("No potential reminders to add");
      }

      onInteractionAdded()
      toast.success('Interaction added and contact updated')
    } catch (error) {
      console.error("Error adding interaction: ", error)
      if (axios.isAxiosError(error)) {
        console.error("API error response:", error.response?.data)
        toast.error(`Failed to add interaction: ${error.response?.data?.error || error.message}`)
      } else {
        toast.error(`Failed to add interaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setIsProcessing(false)
    }
  }, [contactId, date, type, notes, contact, updateContact, onInteractionAdded])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case 'date':
        setDate(value);
        break;
      case 'type':
        setType(value);
        break;
      case 'notes':
        setNotes(value);
        break;
      default:
        console.warn(`Unhandled input change for field: ${name}`);
    }
  }, []);

  const formContent = useMemo(() => (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-md mx-auto">
      <h3 className="text-lg font-semibold">Add Interaction</h3>
      <Input
        type="date"
        name="date"
        value={date}
        onChange={handleInputChange}
        required
      />
      <Input
        name="type"
        placeholder="Interaction type"
        value={type}
        onChange={handleInputChange}
        required
      />
      <Input
        name="notes"
        placeholder="Notes"
        value={notes}
        onChange={handleInputChange}
        required
      />
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Add Interaction'}
        </Button>
        <Button onClick={onCancel} variant="outline" disabled={isProcessing}>Cancel</Button>
      </div>
    </form>
  ), [date, type, notes, isProcessing, handleSubmit, handleInputChange, onCancel])

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {formContent}
    </div>
  )
})

AddInteractionForm.displayName = 'AddInteractionForm'