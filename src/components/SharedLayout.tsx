import React from 'react'
import { MainMenu } from './MainMenu'

interface SharedLayoutProps {
  children: React.ReactNode
}

export const SharedLayout: React.FC<SharedLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      <MainMenu />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}