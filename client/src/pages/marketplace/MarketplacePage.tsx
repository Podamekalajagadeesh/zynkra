import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMarketplaceListings } from '../../lib/api';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getMarketplaceListings(searchTerm).then(setListings);
  }, [searchTerm]);

  return (
    <PageShell>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <Button asChild>
          <Link to="/marketplace/new">Create Listing</Link>
        </Button>
      </div>
      <div className="mb-4">
        <Input
          placeholder="Search listings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <Link to={`/marketplace/listings/${listing.id}`} key={listing.id} className="border rounded-lg p-4">
            <img src={listing.imageUrls?.[0]} alt={listing.title} className="w-full h-48 object-cover rounded-md mb-2" />
            <h2 className="font-bold">{listing.title}</h2>
            <p className="text-gray-500">{listing.price}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}