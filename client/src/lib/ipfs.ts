import { create } from 'kubo-rpc-client';

const ipfs = create({ host: 'localhost', port: 5001, protocol: 'http' });

export const uploadToIPFS = async (file: File): Promise<string> => {
  const { cid } = await ipfs.add(file);
  return cid.toString();
};