'use client';

import Link from 'next/link';
import { Home, Users, Calendar, Bell, Settings, LogOut, CalendarClock, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export function MainMenu() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="w-16 bg-white border-r flex flex-col items-center py-4 h-full">
      <Link href="/" passHref>
        <Button variant="ghost" className="mb-4">
          <Home className="h-6 w-6" />
        </Button>
      </Link>
      <Link href="/contacts" passHref>
        <Button variant="ghost" className="mb-4">
          <Users className="h-6 w-6" />
        </Button>
      </Link>
      <Link href="/calendar" passHref>
        <Button variant="ghost" className="mb-4">
          <Calendar className="h-6 w-6" />
        </Button>
      </Link>
      <Link href="/all-reminders" passHref>
        <Button variant="ghost" className="mb-4">
          <CalendarClock className="h-6 w-6" />
        </Button>
      </Link>
      <Link href="/all-interactions" passHref>
        <Button variant="ghost" className="mb-4">
          <FileText className="h-6 w-6" />
        </Button>
      </Link>
      <Link href="/reminders" passHref>
        <Button variant="ghost" className="mb-4">
          <Bell className="h-6 w-6" />
        </Button>
      </Link>
      <div className="flex-grow" />
      <Button variant="ghost" onClick={handleSignOut}>
        <LogOut className="h-6 w-6" />
      </Button>
    </div>
  );
}