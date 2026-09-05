import { BadRequestException } from '@nestjs/common';
import { LocalizationService } from './localization.service';

describe('LocalizationService', () => {
  const user = {
    id: 'user-1',
    accountPreferences: { language: 'en', timezone: 'UTC', customSettings: { currency: 'USD' } },
  } as any;
  const usersRepository = {
    findOne: jest.fn().mockResolvedValue(user),
    save: jest.fn().mockResolvedValue(user),
  } as any;
  const translationService = {
    getSupportedLanguages: jest.fn().mockReturnValue([{ code: 'en', name: 'English' }]),
    translate: jest.fn().mockResolvedValue({ translatedText: 'Hello', provider: 'test' }),
  } as any;
  const service = new LocalizationService(usersRepository, translationService);

  beforeEach(() => jest.clearAllMocks());

  it('persists validated locale preferences', async () => {
    await expect(service.updatePreferences('user-1', {
      language: 'ar',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    })).resolves.toMatchObject({ language: 'ar', timezone: 'Asia/Kolkata', currency: 'INR', rtl: true });

    expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      accountPreferences: expect.objectContaining({ language: 'ar', timezone: 'Asia/Kolkata' }),
    }));
  });

  it('rejects invalid time zones', async () => {
    await expect(service.updatePreferences('user-1', { timezone: 'not/a-timezone' }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('delegates translation to the configured provider', async () => {
    await service.translate('Hola', 'es', 'en');
    expect(translationService.translate).toHaveBeenCalledWith('Hola', 'es', 'en');
  });
});
