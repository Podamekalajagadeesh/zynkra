import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IdentitySettings } from './entities/identity-settings.entity';
import { CreateIdentitySettingsDto, UpdateIdentitySettingsDto } from './dto/identity-settings.dto';

@Injectable()
export class IdentitySettingsService {
  private readonly logger = new Logger(IdentitySettingsService.name);

  constructor(
    @InjectRepository(IdentitySettings)
    private identitySettingsRepository: Repository<IdentitySettings>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createIdentitySettings(userId: string, createDto: CreateIdentitySettingsDto): Promise<IdentitySettings> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if identity settings already exist
    const existing = await this.identitySettingsRepository.findOne({ where: { user: { id: userId } } });
    if (existing) {
      return this.updateIdentitySettings(userId, createDto);
    }

    const identitySettings = this.identitySettingsRepository.create({
      user,
      userId,
      legalName: createDto.legalName,
      displayName: createDto.displayName,
      bio: createDto.bio,
      publicProfile: createDto.publicProfile || false,
      creatorMode: createDto.creatorMode || false,
      businessMode: createDto.businessMode || false,
      businessName: createDto.businessName,
      businessRegistrationNumber: createDto.businessRegistrationNumber,
      ageVerified: false,
      enhancedSecurity: false,
      verificationRequired: false,
      organizationName: createDto.organizationName,
      organizationRegistrationNumber: createDto.organizationRegistrationNumber,
      organizationWebsite: createDto.organizationWebsite,
      customFields: createDto.customFields,
    });

    const saved = await this.identitySettingsRepository.save(identitySettings);

    this.logger.log(`Identity settings created for user ${userId}`);

    return saved;
  }

  async getIdentitySettings(userId: string): Promise<IdentitySettings> {
    const settings = await this.identitySettingsRepository.findOne({ where: { user: { id: userId } } });

    if (!settings) {
      // Create default identity settings
      return this.createIdentitySettings(userId, {});
    }

    return settings;
  }

  async updateIdentitySettings(userId: string, updateDto: UpdateIdentitySettingsDto): Promise<IdentitySettings> {
    let settings = await this.identitySettingsRepository.findOne({ where: { user: { id: userId } } });

    if (!settings) {
      return this.createIdentitySettings(userId, updateDto);
    }

    if (updateDto.legalName) settings.legalName = updateDto.legalName;
    if (updateDto.displayName) settings.displayName = updateDto.displayName;
    if (updateDto.bio) settings.bio = updateDto.bio;
    if (updateDto.publicProfile !== undefined) settings.publicProfile = updateDto.publicProfile;
    if (updateDto.creatorMode !== undefined) settings.creatorMode = updateDto.creatorMode;
    if (updateDto.businessMode !== undefined) settings.businessMode = updateDto.businessMode;
    if (updateDto.businessName) settings.businessName = updateDto.businessName;
    if (updateDto.businessRegistrationNumber) settings.businessRegistrationNumber = updateDto.businessRegistrationNumber;
    if (updateDto.organizationName) settings.organizationName = updateDto.organizationName;
    if (updateDto.organizationRegistrationNumber) settings.organizationRegistrationNumber = updateDto.organizationRegistrationNumber;
    if (updateDto.organizationWebsite) settings.organizationWebsite = updateDto.organizationWebsite;
    if (updateDto.customFields) settings.customFields = updateDto.customFields;

    const saved = await this.identitySettingsRepository.save(settings);

    this.logger.log(`Identity settings updated for user ${userId}`);

    return saved;
  }

  async enableCreatorMode(userId: string): Promise<IdentitySettings> {
    const settings = await this.getIdentitySettings(userId);
    settings.creatorMode = true;
    return this.identitySettingsRepository.save(settings);
  }

  async disableCreatorMode(userId: string): Promise<IdentitySettings> {
    const settings = await this.getIdentitySettings(userId);
    settings.creatorMode = false;
    return this.identitySettingsRepository.save(settings);
  }

  async enableBusinessMode(userId: string): Promise<IdentitySettings> {
    const settings = await this.getIdentitySettings(userId);
    settings.businessMode = true;
    return this.identitySettingsRepository.save(settings);
  }

  async disableBusinessMode(userId: string): Promise<IdentitySettings> {
    const settings = await this.getIdentitySettings(userId);
    settings.businessMode = false;
    return this.identitySettingsRepository.save(settings);
  }

  async setPublicProfile(userId: string, isPublic: boolean): Promise<IdentitySettings> {
    const settings = await this.getIdentitySettings(userId);
    settings.publicProfile = isPublic;
    return this.identitySettingsRepository.save(settings);
  }

  async markAgeVerified(userId: string): Promise<IdentitySettings> {
    const settings = await this.getIdentitySettings(userId);
    settings.ageVerified = true;
    settings.ageVerificationDate = new Date();
    return this.identitySettingsRepository.save(settings);
  }

  async enableEnhancedSecurity(userId: string): Promise<IdentitySettings> {
    const settings = await this.getIdentitySettings(userId);
    settings.enhancedSecurity = true;
    return this.identitySettingsRepository.save(settings);
  }

  async disableEnhancedSecurity(userId: string): Promise<IdentitySettings> {
    const settings = await this.getIdentitySettings(userId);
    settings.enhancedSecurity = false;
    return this.identitySettingsRepository.save(settings);
  }

  async deleteIdentitySettings(userId: string): Promise<void> {
    const settings = await this.identitySettingsRepository.findOne({ where: { user: { id: userId } } });

    if (settings) {
      await this.identitySettingsRepository.remove(settings);
      this.logger.log(`Identity settings deleted for user ${userId}`);
    }
  }

  async getIdentityVerificationStatus(userId: string): Promise<{
    profileComplete: boolean;
    creatorMode: boolean;
    businessMode: boolean;
    ageVerified: boolean;
    enhancedSecurity: boolean;
  }> {
    const settings = await this.getIdentitySettings(userId);

    return {
      profileComplete: !!(settings.displayName || settings.legalName),
      creatorMode: settings.creatorMode,
      businessMode: settings.businessMode,
      ageVerified: settings.ageVerified,
      enhancedSecurity: settings.enhancedSecurity,
    };
  }
}
