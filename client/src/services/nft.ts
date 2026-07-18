import axios from 'axios';

const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
const BASE_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

export interface Nft {
  contract: {
    address: string;
  };
  id: {
    tokenId: string;
  };
  media: {
    gateway: string;
  }[];
  metadata: {
    name: string;
    description: string;
    image: string;
  };
}

export const getNftsForOwner = async (ownerAddress: string): Promise<Nft[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/getNFTs`, {
      params: {
        owner: ownerAddress,
        withMetadata: true,
        pageSize: 100,
      },
    });
    return response.data.ownedNfts;
  } catch (error) {
    console.error('Failed to fetch NFTs:', error);
    return [];
  }
};