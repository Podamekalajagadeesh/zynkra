import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getMarketplaceListing,
  getSavedMarketplaceListings,
  saveMarketplaceListing,
  unsaveMarketplaceListing,
} from '../../lib/api';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { MarketplaceListing } from '../../lib/types';

export function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (id) {
      getMarketplaceListing(id).then(setListing);
      getSavedMarketplaceListings().then((savedListings) => {
        if (savedListings.some((saved) => saved.listing.id === id)) {
          setIsSaved(true);
        }
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    if (isSaved) {
      await unsaveMarketplaceListing(id);
      setIsSaved(false);
    } else {
      await saveMarketplaceListing(id);
      setIsSaved(true);
    }
  };

  if (!listing) {
    return <PageShell>Loading...</PageShell>;
  }

  return (
    <PageShell>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src={listing.imageUrls?.[0]} alt={listing.title} className="w-full h-auto object-cover rounded-lg" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
          <p className="text-2xl font-bold text-gray-800 mb-4">
            {listing.productType === 'nft' ? `${listing.price} ETH` : `$${listing.price}`}
          </p>
          {listing.productType === 'nft' && listing.nftMetadata && (
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg">
              <h3 className="font-bold text-lg mb-2">NFT Details</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Blockchain: {listing.nftMetadata.blockchain}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Contract: {listing.nftMetadata.contractAddress.slice(0, 6)}...{listing.nftMetadata.contractAddress.slice(-4)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Token ID: {listing.nftMetadata.tokenId}</p>
              {listing.nftMetadata.isLimitedEdition && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Edition: {listing.nftMetadata.editionNumber}/{listing.nftMetadata.totalEditions}</p>
              )}
            </div>
          )}
          <p className="text-gray-600 mb-4">{listing.description}</p>
          <p className="text-sm text-gray-500 mb-4">Location: {listing.location}</p>
          <div className="flex items-center mb-4">
            <img src={listing.seller.avatar} alt={listing.seller.displayName} className="w-10 h-10 rounded-full mr-3" />
            <div>
              <p className="font-semibold">{listing.seller.displayName}</p>
              <Link to={`/profile/${listing.seller.id}`} className="text-sm text-blue-500">View Profile</Link>
            </div>
          </div>
          <Button asChild>
            <Link to={`/dms/new?recipient=${listing.seller.id}&message=I'm interested in your listing: ${listing.title}`}>Contact Seller</Link>
          </Button>
          <Button onClick={handleSave} variant={isSaved ? 'secondary' : 'default'}>
            {isSaved ? 'Unsave' : 'Save'}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}