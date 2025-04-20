'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText, Bell, Upload, Menu, X, LogOut } from 'lucide-react';

interface MobileNavBarProps {
  currentPage?: 'home' | 'reminders' | 'interactions';
  onAddContact?: () => void;
  onShowContactsList?: () => void;
  onGlobalInteraction?: () => void;
  onUploadChatLog?: () => void;
  onSignOut?: () => void;
}

export function MobileNavBar({
  currentPage = 'home',
  onAddContact,
  onShowContactsList,
  onGlobalInteraction,
  onUploadChatLog,
  onSignOut
}: MobileNavBarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Fixed Mobile Navigation Bar */}
      <div className="fixed inset-x-0 bottom-0 h-16 bg-white border-t z-[1000] flex md:hidden">
        <div className="flex w-full justify-around items-center">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddContact ? onAddContact() : navigateTo('/');
            }}
            className={`p-2 rounded-md ${currentPage === 'home' ? 'bg-blue-100 text-blue-500' : ''}`}
            variant="ghost"
          >
            <Plus size={24} />
          </Button>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onShowContactsList ? onShowContactsList() : navigateTo('/');
            }}
            className={`p-2 rounded-md ${currentPage === 'home' ? 'bg-blue-100 text-blue-500' : ''}`}
            variant="ghost"
          >
            <Users size={24} />
          </Button>

          <Button
            onClick={handleMenuToggle}
            className={`p-2 rounded-md ${isMenuOpen ? 'bg-blue-100 text-blue-500' : ''}`}
            variant="ghost"
          >
            <Menu size={24} />
          </Button>
        </div>
      </div>

      {/* Expanded Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-[1001] flex flex-col md:hidden">
          <div className="border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Menu</h2>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
              }}
              className="p-2 rounded-full hover:bg-gray-100"
              variant="ghost"
              size="icon"
            >
              <X size={24} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col space-y-4">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo('/all-reminders');
                }}
                className="p-3 flex items-center space-x-3 rounded-lg hover:bg-gray-100 justify-start"
                variant="ghost"
              >
                <Bell size={20} />
                <span>All Reminders</span>
              </Button>
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onGlobalInteraction) {
                    onGlobalInteraction();
                    setIsMenuOpen(false);
                  }
                }}
                className="p-3 flex items-center space-x-3 rounded-lg hover:bg-gray-100 justify-start"
                variant="ghost"
              >
                <FileText size={20} />
                <span>Global Interaction</span>
              </Button>
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onUploadChatLog) {
                    onUploadChatLog();
                    setIsMenuOpen(false);
                  }
                }}
                className="p-3 flex items-center space-x-3 rounded-lg hover:bg-gray-100 justify-start"
                variant="ghost"
              >
                <Upload size={20} />
                <span>Upload Chat Log</span>
              </Button>
              
              <div className="border-t my-4"></div>
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSignOut) {
                    onSignOut();
                  }
                }}
                className="p-3 flex items-center space-x-3 rounded-lg hover:bg-red-100 text-red-600 justify-start"
                variant="ghost"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 