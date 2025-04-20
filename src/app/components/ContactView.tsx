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
    
    console.log('Checking email breaches for:', email);
    setIsCheckingBreaches(true);
    
    // Clear previous results
    setBreachResults(null);
    
    try {
      // Simple implementation for testing
      const response = await fetch('/api/hibp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the raw response data
      const rawData = await response.json();
      console.log('Raw API response:', rawData);
      
      // Set a simplified version of the data
      setBreachResults({
        found: rawData.found || false,
        message: rawData.message || null,
        error: rawData.error || null,
        breaches: Array.isArray(rawData.breaches) ? rawData.breaches : []
      });
    } catch (error) {
      console.error('Error checking email breaches:', error);
      // Set a simple error object
      setBreachResults({
        found: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        breaches: []
      });
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
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }
      
      const data = await response.json();
      setOsintResults(data);
    } catch (error) {
      console.error('Error fetching OSINT Industries data:', error);
      alert('Error fetching OSINT data. Please check the console for details.');
    } finally {
      setIsSearching(false);
    }
  };

  // A safe rendering function to handle the breach data
  const renderBreachResults = () => {
    if (!breachResults) return null;
    
    return (
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
            
            {breachResults.breaches.length > 0 ? (
              <div className="grid gap-3">
                {breachResults.breaches.map((breach: any, index: number) => (
                  <div key={breach.Name || index} className="border p-3 rounded-md">
                    <h4 className="font-bold">{breach.Name || 'Unknown Breach'}</h4>
                    
                    {breach.BreachDate && (
                      <p className="text-sm">
                        Breach date: {new Date(breach.BreachDate).toLocaleDateString()}
                      </p>
                    )}
                    
                    {breach.Description && (
                      <p dangerouslySetInnerHTML={{ __html: breach.Description }}></p>
                    )}
                    
                    {breach.DataClasses && Array.isArray(breach.DataClasses) && (
                      <p className="text-sm mt-2">
                        Data compromised: {breach.DataClasses.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">No detailed breach information available.</div>
            )}
          </div>
        ) : (
          <div className="bg-green-100 text-green-800 p-3 rounded-md">
            {breachResults.message || "Good news! This email was not found in any known data breaches."}
          </div>
        )}
      </div>
    );
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

      {/* Use the safe rendering function for breach results */}
      {renderBreachResults()}

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
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
        <p className="text-yellow-700">
          <strong>Note:</strong> This application is using static export mode (<code>output: 'export'</code> in Next.js config), 
          which doesn't support API routes. For demonstration purposes, the breach check and OSINT search features 
          are showing simulated results. To enable full functionality, deploy serverless functions 
          or remove <code>output: 'export'</code> from your Next.js config.
        </p>
      </div>
    </div>
  );
}