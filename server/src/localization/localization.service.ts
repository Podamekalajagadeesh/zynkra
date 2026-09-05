import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { TranslationService } from '../translation/translation.service';

export interface LocalePreferences {
  language: string;
  timezone: string;
  currency: string;
  rtl: boolean;
}

const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur']);
const DEFAULT_TIMEZONE = 'UTC';
const DEFAULT_CURRENCY = 'USD';

@Injectable()
export class LocalizationService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly translationService: TranslationService,
  ) {}

  getSupportedLanguages() {
    return this.translationService.getSupportedLanguages().map((language) => ({
      ...language,
      rtl: RTL_LANGUAGES.has(language.code),
    }));
  }

  async getPreferences(userId: string): Promise<LocalePreferences> {
    const user = await this.findUser(userId);
    return this.toPreferences(user.accountPreferences);
  }

  async updatePreferences(
    userId: string,
    input: Partial<LocalePreferences>,
  ): Promise<LocalePreferences> {
    const user = await this.findUser(userId);
    const current = this.toPreferences(user.accountPreferences);
    const next = {
      language: input.language ?? current.language,
      timezone: input.timezone ?? current.timezone,
      currency: input.currency ?? current.currency,
    };

    this.validateLanguage(next.language);
    this.validateTimezone(next.timezone);
    this.validateCurrency(next.currency);

    user.accountPreferences = {
      ...(user.accountPreferences ?? {}),
      language: next.language,
      timezone: next.timezone,
      customSettings: {
        ...(user.accountPreferences?.customSettings ?? {}),
        currency: next.currency,
      },
      updatedAt: new Date().toISOString(),
    };
    await this.usersRepository.save(user);
    return this.toPreferences(user.accountPreferences);
  }

  translate(text: string, sourceLanguage = 'auto', targetLanguage = 'en') {
    this.validateLanguage(targetLanguage);
    if (sourceLanguage !== 'auto') {
      this.validateLanguage(sourceLanguage);
    }
    return this.translationService.translate(text, sourceLanguage, targetLanguage);
  }

  formatDate(value: Date | string | number, locale: string, timezone = DEFAULT_TIMEZONE) {
    this.validateTimezone(timezone);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(new Date(value));
  }

  formatNumber(value: number, locale: string) {
    if (!Number.isFinite(value)) {
      throw new BadRequestException('Value must be a finite number');
    }
    return new Intl.NumberFormat(locale).format(value);
  }

  formatCurrency(value: number, currency: string, locale: string) {
    this.validateCurrency(currency);
    if (!Number.isFinite(value)) {
      throw new BadRequestException('Amount must be a finite number');
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }

  isRtl(language: string) {
    this.validateLanguage(language);
    return RTL_LANGUAGES.has(language.split('-')[0].toLowerCase());
  }

  private async findUser(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private toPreferences(accountPreferences: User['accountPreferences']): LocalePreferences {
    const language = accountPreferences?.language ?? 'en';
    const timezone = accountPreferences?.timezone ?? DEFAULT_TIMEZONE;
    const currency = accountPreferences?.customSettings?.currency ?? DEFAULT_CURRENCY;
    return { language, timezone, currency, rtl: RTL_LANGUAGES.has(language.split('-')[0].toLowerCase()) };
  }

  private validateLanguage(language: string) {
    if (!/^[a-z]{2}(?:-[A-Z]{2})?$/i.test(language)) {
      throw new BadRequestException('Invalid language code');
    }
  }

  private validateTimezone(timezone: string) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
    } catch {
      throw new BadRequestException('Invalid time zone');
    }
  }

  private validateCurrency(currency: string) {
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new BadRequestException('Currency must be a three-letter ISO 4217 code');
    }
  }
}
