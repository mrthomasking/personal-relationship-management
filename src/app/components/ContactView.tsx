import { useState } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContactView() {
  const [email, setEmail] = useState('');
  const [osintResults, setOsintResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [breachResults, setBreachResults] = useState<any>(null);
  const [isCheckingBreaches, setIsCheckingBreaches] = useState(false);
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  const handleSearchSocialMedia = async () => {
    // Placeholder for social media search functionality
    console.log('Searching social media for:', email);
  };

  const handleCheckEmailBreaches = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }
    
    setIsCheckingBreaches(true);
    try {
      const response = await fetch('/api/hibp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setBreachResults(data);
    } catch (error) {
      console.error('Error checking email breaches:', error);
      alert('Error checking breaches. Please check the console for details.');
    } finally {
      setIsCheckingBreaches(false);
    }
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
        <Button onClick={handleCheckEmailBreaches} disabled={isCheckingBreaches}>
          {isCheckingBreaches ? 'Checking...' : 'Check Email Breaches'}
        </Button>
        <Button onClick={handleEnrichLinkedInData}>Enrich LinkedIn Data</Button>
        <Button onClick={handleOsintIndustriesSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'OSINT Industries Search'}
        </Button>
      </div>

      {/* Display Breach results */}
      {breachResults && (
        <div className="border rounded-lg p-4 mt-4">
          <h3 className="text-lg font-bold mb-2">Email Breach Results</h3>
          <p className="text-sm text-gray-500 mb-4">Data retrieved from Have I Been Pwned API</p>
          {breachResults.error ? (
            <div className="text-red-500">{breachResults.error}</div>
          ) : breachResults.found ? (
            <div>
              <div className="bg-red-100 text-red-800 p-3 rounded-md mb-3">
                This email appears in {breachResults.breaches.length} data breaches.
              </div>
              <div className="grid gap-3">
                {breachResults.breaches.map((breach: any) => (
                  <div key={breach.Name} className="border p-3 rounded-md">
                    <h4 className="font-bold">{breach.Name}</h4>
                    <p className="text-sm">Breach date: {new Date(breach.BreachDate).toLocaleDateString()}</p>
                    <p dangerouslySetInnerHTML={{ __html: breach.Description }}></p>
                    <p className="text-sm mt-2">
                      Data compromised: {breach.DataClasses.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-100 text-green-800 p-3 rounded-md">
              Good news! This email was not found in any known data breaches.
            </div>
          )}
        </div>
      )}

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