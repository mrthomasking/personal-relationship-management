import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useContacts } from '@/lib/hooks/useContacts';

interface UploadChatLogProps {
  onClose: () => void;
}

export const UploadChatLog: React.FC<UploadChatLogProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { contacts } = useContacts();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedContactId) {
      toast.error('Please select a file and a contact');
      return;
    }

    setIsProcessing(true);
    const selectedContact = contacts.find(contact => contact.id === selectedContactId);
    if (!selectedContact) {
      toast.error('Selected contact not found');
      setIsProcessing(false);
      return;
    }

    try {
      const fileContent = await file.text();
      const chunks = splitTextIntoChunks(fileContent, 200000); // Changed chunk size to 200000 characters

      let allResults = '';
      for (let i = 0; i < chunks.length; i++) {
        const formData = new FormData();
        formData.append('chunk', chunks[i]);
        formData.append('contactId', selectedContactId);
        formData.append('contactName', selectedContact.name);
        formData.append('contactPhone', selectedContact.phone || '');
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', chunks.length.toString());

        const response = await axios.post('/api/process-chat-log', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          allResults += response.data.result + ' ';
          toast.success(`Processed chunk ${i + 1} of ${chunks.length}`);
        } else {
          throw new Error(response.data.error || 'Failed to process chat log chunk');
        }

        // Add a delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log("All processed results:", allResults);

      // Update the contact with all processed results
      const updateResponse = await axios.post('/api/update-contact', {
        contactId: selectedContactId,
        chatLogInsights: allResults.trim()
      });

      console.log("Update contact response:", updateResponse.data);

      toast.success('Chat log processed successfully');
      onClose();
    } catch (error) {
      console.error('Error processing chat log:', error);
      toast.error('An error occurred while processing the chat log');
    } finally {
      setIsProcessing(false);
    }
  }, [file, selectedContactId, contacts, onClose]);

  const splitTextIntoChunks = (text: string, chunkSize: number): string[] => {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Upload WhatsApp Chat Log</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
            Select Contact
          </label>
          <select
            id="contact"
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">Select a contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Upload Chat Log
          </label>
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            accept=".txt"
            required
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Upload and Process'}
          </Button>
        </div>
      </form>
    </div>
  );
};