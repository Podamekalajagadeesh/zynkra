import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GifResult {
  id: string;
  title: string;
  url: string | null;
  previewUrl: string | null;
}

@Injectable()
export class GifsService {
  private readonly logger = new Logger(GifsService.name);

  constructor(private readonly configService: ConfigService) {}

  async search(query: string, limit = 24): Promise<GifResult[]> {
    const apiKey = this.configService.get<string>('GIPHY_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('GIF search is not configured');
    }

    const { data } = await axios.get('https://api.giphy.com/v1/gifs/search', {
      params: { api_key: apiKey, q: query, limit, rating: 'g' },
      timeout: 8000,
    });

    return (data?.data ?? []).map((gif: any) => ({
      id: gif.id,
      title: gif.title,
      url: gif.images?.fixed_height?.url ?? null,
      previewUrl: gif.images?.fixed_height_small?.url ?? null,
    }));
  }
}
