import { useState } from 'react';
import { useChat } from 'ai/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export function ContactView({
  contact,
  updateContact,
  onEdit,
  onAddInteraction,
  onExportDocx,
  handleCheckEmailBreaches,
  handleEnrichLinkedInData,
  handleOsintIndustriesSearch,
  searchSocialMediaProfiles,
  isCheckingBreaches,
  isEnrichingLinkedIn,
  isSearchingOsint,
  isSearchingSocialMedia,
  isEditMode
}: ContactViewProps) {
  const [editedContact, setEditedContact] = useState<Contact>(contact);

  const handleTidyText = async () => {
    if (!contact.otherInsights) {
      toast.error('No text to tidy');
      return;
    }

    try {
      const response = await axios.post('/api/tidy-text', {
        text: contact.otherInsights
      });

      if (response.data.success) {
        const updatedContact = {
          ...contact,
          otherInsights: response.data.tidiedText
        };
        updateContact(updatedContact);
        toast.success('Text tidied successfully');
      } else {
        throw new Error(response.data.error || 'Failed to tidy text');
      }
    } catch (error) {
      console.error('Error tidying text:', error);
      toast.error('Failed to tidy text');
    }
  };

  // ... (rest of the component code)

  return (
    <div className="flex flex-col space-y-4">
      {/* ... (other fields) */}
      
      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-2">Other Insights</h3>
        <textarea
          value={isEditMode ? editedContact.otherInsights : contact.otherInsights}
          onChange={(e) => setEditedContact({ ...editedContact, otherInsights: e.target.value })}
          className="w-full h-32 p-2 border rounded mb-2"
          readOnly={!isEditMode}
        />
        <div className="mt-2">
          <Button
            onClick={handleTidyText}
            className="w-full bg-blue-500 text-white"
            size="sm"
          >
            Tidy Text
          </Button>
          <div className="text-sm text-gray-500 mt-1">
            Debug: isEditMode = {isEditMode ? 'true' : 'false'}
          </div>
        </div>
      </div>

      {/* ... (rest of the JSX) */}
    </div>
  );
}