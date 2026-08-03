import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X } from 'lucide-react';
import { searchGifs } from '../lib/api';

interface StickerLibraryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const StickerLibrary: React.FC<StickerLibraryProps> = ({ onSelect, onClose }) => {
  const [gifs, setGifs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('trending');

  useEffect(() => {
    const fetchGifs = async () => {
      try {
        // GIFs are proxied through the server so the Giphy API key stays server-side.
        const results = await searchGifs(searchTerm, 24);
        setGifs(
          results.map((gif: { id: string; title: string; url: string | null }) => ({
            id: gif.id,
            title: gif.title,
            images: { fixed_height: { url: gif.url } },
          })),
        );
      } catch (error) {
        console.error('Error fetching GIFs:', error);
      }
    };

    fetchGifs();
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Sticker Library</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search for GIFs and Stickers"
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-4 gap-4 h-96 overflow-y-auto">
          {gifs.map(gif => (
            <div
              key={gif.id}
              className="cursor-pointer"
              onClick={() => onSelect(gif.images.fixed_height.url)}
            >
              <img src={gif.images.fixed_height.url} alt={gif.title} className="w-full h-full object-cover rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StickerLibrary;