import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast';

interface SocialMediaSearchProps {
  onResultsFound: (results: any) => void;
  onSearch: (name: string) => Promise<any>;
}

export function SocialMediaSearch({ onResultsFound, onSearch }: SocialMediaSearchProps) {
  const [name, setName] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!name) {
      toast.error('Please enter a name to search');
      return;
    }

    setIsSearching(true);
    try {
      const results = await onSearch(name);
      onResultsFound(results);
      toast.success('Social media search completed');
    } catch (error) {
      console.error('Error searching social media:', error);
      toast.error('Failed to search social media');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <Input
        placeholder="Enter name to search"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button onClick={handleSearch} disabled={isSearching}>
        {isSearching ? 'Searching...' : 'Search Social Media'}
      </Button>
    </div>
  );
}