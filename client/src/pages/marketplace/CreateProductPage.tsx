import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, uploadMedia } from '../../lib/api';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';

export function CreateProductPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [productType, setProductType] = useState<'physical' | 'digital' | 'print-on-demand' | 'nft'>('physical');
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [podProvider, setPodProvider] = useState('');
  const [uploading, setUploading] = useState(false);
  // NFT specific fields
  const [contractAddress, setContractAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [blockchain, setBlockchain] = useState('ethereum');
  const [metadataUri, setMetadataUri] = useState('');
  const [isLimitedEdition, setIsLimitedEdition] = useState(false);
  const [editionNumber, setEditionNumber] = useState('');
  const [totalEditions, setTotalEditions] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const productData: any = {
        name,
        description,
        price: parseFloat(price),
        productType
      };

      // Handle digital product file upload
      if (productType === 'digital' && digitalFile) {
        const { url } = await uploadMedia(digitalFile);
        productData.fileUrl = url;
      }

      // Handle print-on-demand settings
      if (productType === 'print-on-demand' && podProvider) {
        productData.printOnDemandSettings = {
          provider: podProvider,
          baseCost: 0,
          shippingLocations: ['US', 'CA', 'EU'],
          variants: []
        };
      }

      // Handle NFT metadata
      if (productType === 'nft') {
        productData.nftMetadata = {
          contractAddress,
          tokenId,
          blockchain,
          metadataUri,
          isLimitedEdition,
          editionNumber: editionNumber ? parseInt(editionNumber) : undefined,
          totalEditions: totalEditions ? parseInt(totalEditions) : undefined,
          attributes: []
        };
      }

      await api.post('/products', productData);
      navigate('/marketplace/dashboard');
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell>
      <h1 className="text-2xl font-bold mb-4">Add Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        
        <div>
          <Label htmlFor="productType">Product Type</Label>
          <Select value={productType} onValueChange={(value: any) => setProductType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select product type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="physical">Physical Product</SelectItem>
              <SelectItem value="digital">Digital Product (e-book, course)</SelectItem>
              <SelectItem value="print-on-demand">Print-on-Demand Merchandise</SelectItem>
              <SelectItem value="nft">NFT / Digital Collectible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="price">Price ($)</Label>
          <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>

        {/* Digital product specific field */}
        {productType === 'digital' && (
          <div>
            <Label htmlFor="digitalFile">Digital File (PDF, ZIP, etc.)</Label>
            <Input 
              id="digitalFile" 
              type="file" 
              onChange={(e) => setDigitalFile(e.target.files?.[0] || null)} 
              required
            />
          </div>
        )}

        {/* Print-on-demand specific fields */}
        {productType === 'print-on-demand' && (
          <div>
            <Label htmlFor="podProvider">Print-on-Demand Provider</Label>
            <Select value={podProvider} onValueChange={setPodProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="printful">Printful</SelectItem>
                <SelectItem value="redbubble">Redbubble</SelectItem>
                <SelectItem value="teespring">Teespring</SelectItem>
                <SelectItem value="custom">Custom Provider</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* NFT specific fields */}
        {productType === 'nft' && (
          <>
            <div>
              <Label htmlFor="contractAddress">Contract Address</Label>
              <Input 
                id="contractAddress" 
                value={contractAddress} 
                onChange={(e) => setContractAddress(e.target.value)} 
                placeholder="0x..."
                required
              />
            </div>
            <div>
              <Label htmlFor="tokenId">Token ID</Label>
              <Input 
                id="tokenId" 
                value={tokenId} 
                onChange={(e) => setTokenId(e.target.value)} 
                placeholder="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="blockchain">Blockchain</Label>
              <Select value={blockchain} onValueChange={setBlockchain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blockchain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="optimism">Optimism</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="metadataUri">Metadata URI (IPFS/Arweave)</Label>
              <Input 
                id="metadataUri" 
                value={metadataUri} 
                onChange={(e) => setMetadataUri(e.target.value)} 
                placeholder="ipfs://..."
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isLimitedEdition" 
                checked={isLimitedEdition}
                onChange={(e) => setIsLimitedEdition(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isLimitedEdition">Limited Edition</Label>
            </div>
            {isLimitedEdition && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editionNumber">Edition Number</Label>
                  <Input 
                    id="editionNumber" 
                    type="number"
                    value={editionNumber} 
                    onChange={(e) => setEditionNumber(e.target.value)} 
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="totalEditions">Total Editions</Label>
                  <Input 
                    id="totalEditions" 
                    type="number"
                    value={totalEditions} 
                    onChange={(e) => setTotalEditions(e.target.value)} 
                    placeholder="100"
                  />
                </div>
              </div>
            )}
          </>
        )}

        <Button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Add Product'}
        </Button>
      </form>
    </PageShell>
  );
}