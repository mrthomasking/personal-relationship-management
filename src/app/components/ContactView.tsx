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
      
      // Get the response data
      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Handle the response based on its format
      if (data.message) {
        // No breaches found or error message
        setBreachResults({
          found: false,
          message: data.message
        });
      } else if (Array.isArray(data)) {
        // Breaches found (data is an array of breaches)
        setBreachResults({
          found: true,
          breaches: data
        });
      } else {
        // Unknown format
        setBreachResults({
          found: false,
          message: "Received unexpected data format from API"
        });
      }
    } catch (error) {
      console.error('Error checking email breaches:', error);
      // Set a simple error object
      setBreachResults({
        found: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
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
    // Similar issue with OSINT Industries - for static exports we would need an external service
    try {
      // Simulating a response as with the breach check
      setTimeout(() => {
        const mockData = {
          results: [
            { source: "OSINT Industries", info: "This is a simulated result" }
          ]
        };
        setOsintResults(mockData);
        setIsSearching(false);
      }, 1500);
    } catch (error) {
      console.error('Error fetching OSINT Industries data:', error);
      alert('Error fetching OSINT data. Please check the console for details.');
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

      {/* Display breach results */}
      {breachResults && (
        <div className="border rounded-lg p-4 mt-4">
          <h3 className="text-lg font-bold mb-2">Email Breach Results</h3>
          
          {breachResults.error ? (
            <div className="text-red-500">Error: {breachResults.error}</div>
          ) : breachResults.found ? (
            <div>
              <div className="bg-red-100 text-red-800 p-3 rounded-md mb-3">
                This email appears in {breachResults.breaches.length} data breaches.
              </div>
              <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2 text-left">Name</th>
                      <th className="border px-4 py-2 text-left">Domain</th>
                      <th className="border px-4 py-2 text-left">Breach Date</th>
                      <th className="border px-4 py-2 text-left">Data Classes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breachResults.breaches.map((breach: any, index: number) => (
                      <tr key={breach.Name || index}>
                        <td className="border px-4 py-2">{breach.Name || 'Unknown'}</td>
                        <td className="border px-4 py-2">{breach.Domain || 'Unknown'}</td>
                        <td className="border px-4 py-2">
                          {breach.BreachDate ? new Date(breach.BreachDate).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="border px-4 py-2">
                          {Array.isArray(breach.DataClasses) ? breach.DataClasses.join(', ') : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-green-100 text-green-800 p-3 rounded-md">
              {breachResults.message || "Good news! This email was not found in any known data breaches."}
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