import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GifsService } from './gifs.service';

jest.mock('axios');

const mockedAxiosGet = axios.get as jest.Mock;

describe('GifsService', () => {
  let service: GifsService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [GifsService, { provide: ConfigService, useValue: { get: jest.fn() } }],
    }).compile();

    service = module.get<GifsService>(GifsService);
    configService = module.get(ConfigService);
  });

  it('throws ServiceUnavailableException when no Giphy key is configured', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(service.search('cats')).rejects.toThrow(ServiceUnavailableException);
  });

  it('maps Giphy results to a compact shape', async () => {
    configService.get.mockReturnValue('test-key');
    mockedAxiosGet.mockResolvedValue({
      data: {
        data: [
          {
            id: 'gif-1',
            title: 'Cat GIF',
            images: { fixed_height: { url: 'https://media.giphy.com/1.gif' }, fixed_height_small: { url: 'https://media.giphy.com/1s.gif' } },
          },
        ],
      },
    });

    const result = await service.search('cats', 5);

    expect(configService.get).toHaveBeenCalledWith('GIPHY_API_KEY');
    expect(mockedAxiosGet).toHaveBeenCalledWith(
      'https://api.giphy.com/v1/gifs/search',
      expect.objectContaining({ params: expect.objectContaining({ q: 'cats', limit: 5 }) }),
    );
    expect(result).toEqual([
      { id: 'gif-1', title: 'Cat GIF', url: 'https://media.giphy.com/1.gif', previewUrl: 'https://media.giphy.com/1s.gif' },
    ]);
  });
});
