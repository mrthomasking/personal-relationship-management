import React from 'react';
import MainMenu from './MainMenu';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen">
      <MainMenu />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}