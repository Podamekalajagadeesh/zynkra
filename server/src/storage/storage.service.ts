import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageService {
  async upload(file: Buffer): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([file as any]));

    const response = await fetch('http://localhost:5001/api/v0/add', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file to IPFS: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.Hash;
  }

  async delete(fileReference: string): Promise<void> {
    if (!fileReference) {
      return;
    }

    if (fileReference.startsWith('/uploads/')) {
      const response = await fetch(`http://localhost:5001/api/v0/unpin?arg=${encodeURIComponent(fileReference)}`, {
        method: 'POST',
      });
      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to remove stored file: ${response.status} ${response.statusText}`);
      }
      return;
    }

    const response = await fetch(`http://localhost:5001/api/v0/pin/rm?arg=${encodeURIComponent(fileReference)}`, {
      method: 'POST',
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to unpin stored file: ${response.status} ${response.statusText}`);
    }
  }
}