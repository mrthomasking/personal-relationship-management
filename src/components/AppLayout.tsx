import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logoutUser } = useAuth();

  return (
    <div className="flex h-screen">
      {/* Left side menu */}
      <div className="w-64 bg-gray-100 p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-4">PersonalRM</h1>
        <nav className="space-y-2 mb-auto">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start">Contacts</Button>
          </Link>
          <Link href="/all-reminders">
            <Button variant="ghost" className="w-full justify-start">Reminders</Button>
          </Link>
          {/* Add more navigation items as needed */}
        </nav>
        {user && (
          <Button onClick={logoutUser} variant="outline" className="mt-4">
            Logout
          </Button>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}