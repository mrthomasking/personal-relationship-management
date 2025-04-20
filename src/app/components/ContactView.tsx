import { useState } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContactView() {
  const [email, setEmail] = useState('');
  const [osintResults, setOsintResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  const handleSearchSocialMedia = async () => {
    // Placeholder for social media search functionality
    console.log('Searching social media for:', email);
  };

  const handleCheckEmailBreaches = async () => {
    // Placeholder for email breaches check functionality
    console.log('Checking email breaches for:', email);
  };

  const handleEnrichLinkedInData = async () => {
    // Placeholder for LinkedIn data enrichment functionality
    console.log('Enriching LinkedIn data for:', email);
  };

  const handleOsintIndustriesSearch = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/osint-industries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setOsintResults(data);
    } catch (error) {
      console.error('Error fetching OSINT Industries data:', error);
      alert('Error fetching OSINT data. Please check the console for details.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <Input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSearchSocialMedia}>Search Social Media Profiles</Button>
        <Button onClick={handleCheckEmailBreaches}>Check Email Breaches</Button>
        <Button onClick={handleEnrichLinkedInData}>Enrich LinkedIn Data</Button>
        <Button onClick={handleOsintIndustriesSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'OSINT Industries Search'}
        </Button>
      </div>

      {/* Display OSINT Industries results */}
      {osintResults && (
        <div className="border rounded-lg p-4 mt-4">
          <h3 className="text-lg font-bold mb-2">OSINT Industries Results</h3>
          <p className="text-sm text-gray-500 mb-4">Data retrieved from OSINT Industries API</p>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            {JSON.stringify(osintResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}