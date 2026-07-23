import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSavedMarketplaceListings } from '../../lib/api';
import { MarketplaceListing } from '../../lib/types';
import { PageShell } from '../../components/PageShell';

export function SavedMarketplaceListingsPage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);

  useEffect(() => {
    getSavedMarketplaceListings().then((savedListings) => {
      setListings(savedListings.map((saved) => saved.listing));
    });
  }, []);

  return (
    <PageShell>
      <h1 className="text-2xl font-bold mb-4">Saved Marketplace Listings</h1>
      {listings.length === 0 ? (
        <p>You haven't saved any listings yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <Link
              to={`/marketplace/listings/${listing.id}`}
              key={listing.id}
              className="border rounded-lg p-4"
            >
              <img
                src={listing.imageUrls?.[0]}
                alt={listing.title}
                className="w-full h-48 object-cover rounded-md mb-2"
              />
              <h2 className="font-bold">{listing.title}</h2>
              <p className="text-gray-500">{listing.price}</p>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}