'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { ReminderForm } from '@/components/ReminderForm';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Calendar, Bell, CalendarClock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  contactId: string;
  isCompleted: boolean;
}

export default function RemindersDashboard() {
  const { user, loading, signOut } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const router = useRouter();

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    const q = query(collection(db, 'reminders'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const fetchedReminders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
    setReminders(fetchedReminders);
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to view reminders</div>;
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
          <Bell className="h-6 w-6" />
        </Button>
        <Button variant="ghost" className="mb-4">
          <CalendarClock className="h-6 w-6" />
        </Button>
        <div className="flex-grow" />
        <Button variant="ghost" onClick={handleSignOut}>
          <LogOut className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex flex-col flex-1">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Reminders Dashboard</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Button onClick={() => setIsAddingReminder(true)} className="mb-4">Add Reminder</Button>
            {isAddingReminder && (
              <ReminderForm
                onReminderAdded={() => {
                  setIsAddingReminder(false);
                  fetchReminders();
                }}
                onCancel={() => setIsAddingReminder(false)}
              />
            )}
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4">
                {reminders.map(reminder => (
                  <div key={reminder.id} className="bg-white shadow rounded-lg p-4">
                    <h3 className="font-semibold">{reminder.title}</h3>
                    <p>{reminder.description}</p>
                    <p>Due: {new Date(reminder.dueDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </main>
      </div>
    </div>
  );
}