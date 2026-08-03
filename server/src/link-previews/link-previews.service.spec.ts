import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { LinkPreviewsService } from './link-previews.service';
import { LinkPreview } from './entities/link-preview.entity';

jest.mock('axios');
jest.mock('dns/promises', () => ({
  lookup: jest.fn().mockResolvedValue({ address: '93.184.216.34', family: 4 }),
}));

const mockedAxiosGet = axios.get as jest.Mock;

function makePreview(overrides: Partial<LinkPreview> = {}): LinkPreview {
  const preview = new LinkPreview();
  Object.assign(preview, {
    url: 'https://example.com/article',
    title: 'Example Article',
    description: 'A test article.',
    image: 'https://example.com/img.png',
    siteName: 'Example',
    favicon: 'https://example.com/favicon.ico',
    fetchedAt: new Date(),
    ...overrides,
  });
  return preview;
}

describe('LinkPreviewsService', () => {
  let service: LinkPreviewsService;
  let previewsRepo: jest.Mocked<Repository<LinkPreview>>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkPreviewsService,
        {
          provide: getRepositoryToken(LinkPreview),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LinkPreviewsService>(LinkPreviewsService);
    previewsRepo = module.get(getRepositoryToken(LinkPreview));
  });

  describe('unfurl', () => {
    it('returns a fresh cached preview without fetching', async () => {
      const preview = makePreview();
      previewsRepo.findOne.mockResolvedValue(preview);

      const result = await service.unfurl('https://example.com/article');

      expect(result).toBe(preview);
      expect(mockedAxiosGet).not.toHaveBeenCalled();
    });

    it('fetches and parses OG metadata on cache miss', async () => {
      previewsRepo.findOne.mockResolvedValue(null);
      mockedAxiosGet.mockResolvedValue({
        data: `<html><head>
          <title>Raw Title</title>
          <meta property="og:title" content="OG Title" />
          <meta property="og:description" content="OG Description" />
          <meta property="og:image" content="https://example.com/og.png" />
          <meta property="og:site_name" content="Example" />
          <link rel="icon" href="/favicon.ico" />
        </head></html>`,
      });
      previewsRepo.create.mockImplementation((partial) => makePreview(partial as Partial<LinkPreview>));
      previewsRepo.save.mockImplementation(async (preview: any) => preview as LinkPreview);

      const result = await service.unfurl('https://example.com/article');

      expect(result.title).toBe('OG Title');
      expect(result.description).toBe('OG Description');
      expect(result.image).toBe('https://example.com/og.png');
      expect(result.siteName).toBe('Example');
      expect(result.favicon).toBe('/favicon.ico');
      expect(previewsRepo.save).toHaveBeenCalled();
    });

    it('falls back to the raw <title> when no OG tag exists', async () => {
      previewsRepo.findOne.mockResolvedValue(null);
      mockedAxiosGet.mockResolvedValue({ data: '<html><head><title>Raw Title</title></head></html>' });
      previewsRepo.create.mockImplementation((partial) => makePreview(partial as Partial<LinkPreview>));
      previewsRepo.save.mockImplementation(async (preview: any) => preview as LinkPreview);

      const result = await service.unfurl('https://example.com/no-og');

      expect(result.title).toBe('Raw Title');
    });

    it('rejects non-http URLs', async () => {
      await expect(service.unfurl('file:///etc/passwd')).rejects.toThrow(BadRequestException);
      expect(previewsRepo.save).not.toHaveBeenCalled();
    });

    it('rejects private/local hosts', async () => {
      await expect(service.unfurl('http://localhost:3000/')).rejects.toThrow(BadRequestException);
    });
  });
});
