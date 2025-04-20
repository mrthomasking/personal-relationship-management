import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

interface ReminderFormProps {
  contactId: string;
  onReminderAdded: () => void;
  onCancel: () => void;
}

export function ReminderForm({ contactId, onReminderAdded, onCancel }: ReminderFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) {
      toast.error('No contact selected');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'reminders'), {
        contactId,
        title,
        description,
        date,
        isCompleted: false,  // Add this line
        createdAt: new Date()
      });
      console.log("Reminder added with ID: ", docRef.id);
      // Reset form fields
      setTitle('');
      setDescription('');
      setDate('');
      onReminderAdded();
    } catch (error) {
      console.error("Error adding reminder: ", error);
      toast.error('Failed to add reminder');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Reminder title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <div className="flex justify-end space-x-2">
        <Button type="submit">Add Reminder</Button>
        <Button onClick={onCancel} variant="outline">Cancel</Button>
      </div>
    </form>
  );
}