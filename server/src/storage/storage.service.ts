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
}