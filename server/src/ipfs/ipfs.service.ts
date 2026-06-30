import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly ipfsApiUrl = 'http://localhost:5001/api/v0';

  async upload(file: Buffer): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([file as any]));

    const response = await fetch(`${this.ipfsApiUrl}/add`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file to IPFS: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    this.logger.log(`File uploaded to IPFS with CID: ${result.Hash}`);
    
    // Pin the file to ensure it's not garbage collected
    await this.pinFile(result.Hash);
    
    return result.Hash;
  }

  async pinFile(cid: string): Promise<void> {
    try {
      const response = await fetch(`${this.ipfsApiUrl}/pin/add?arg=${cid}`, {
        method: 'POST',
      });

      if (!response.ok) {
        this.logger.warn(`Failed to pin file ${cid}: ${response.status} ${response.statusText}`);
      } else {
        this.logger.log(`File ${cid} pinned successfully`);
      }
    } catch (error) {
      this.logger.error(`Error pinning file ${cid}:`, error);
    }
  }

  async getFile(cid: string): Promise<Buffer> {
    const response = await fetch(`${this.ipfsApiUrl}/cat?arg=${cid}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to retrieve file ${cid} from IPFS: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async unpinFile(cid: string): Promise<void> {
    try {
      const response = await fetch(`${this.ipfsApiUrl}/pin/rm?arg=${cid}`, {
        method: 'POST',
      });

      if (!response.ok) {
        this.logger.warn(`Failed to unpin file ${cid}: ${response.status} ${response.statusText}`);
      } else {
        this.logger.log(`File ${cid} unpinned successfully`);
      }
    } catch (error) {
      this.logger.error(`Error unpinning file ${cid}:`, error);
    }
  }

  async getPinnedFiles(): Promise<string[]> {
    const response = await fetch(`${this.ipfsApiUrl}/pin/ls`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to list pinned files: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return Object.keys(result);
  }
}