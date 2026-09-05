import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { User } from '../users/entities/user.entity';
import { Authenticator } from './entities/authenticator.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class WebauthnService {
  constructor(
    @InjectRepository(Authenticator)
    private readonly authenticatorsRepository: Repository<Authenticator>,
    private readonly configService: ConfigService,
  ) {}

  private getWebAuthnOrigin(): string {
    return this.configService.get<string>('WEBAUTHN_ORIGIN')
      || this.configService.get<string>('CLIENT_URL')
      || 'http://localhost:5173';
  }

  private getWebAuthnRpId(): string {
    const configuredRpId = this.configService.get<string>('WEBAUTHN_RP_ID');
    if (configuredRpId) return configuredRpId;

    const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:5173';
    try {
      return new URL(clientUrl).hostname;
    } catch {
      return 'localhost';
    }
  }

  private normalizeCredentialId(value: string): string {
    if (!value) return value;
    let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const remainder = normalized.length % 4;
    if (remainder === 2) normalized += '==';
    else if (remainder === 3) normalized += '=';
    return normalized;
  }

  async getRegistrationOptions(user: User) {
    const existingAuthenticators = await this.authenticatorsRepository.find({
      where: { user: { id: user.id } },
    });

    return generateRegistrationOptions({
      rpName: 'Zynkra',
      rpID: this.getWebAuthnRpId(),
      userID: user.id,
      userName: user.email,
      excludeCredentials: existingAuthenticators.map((auth) => ({
        id: Buffer.from(auth.credentialID, 'base64'),
        type: 'public-key',
        transports: auth.transports ? auth.transports.split(',') as any : [],
      })),
    });
  }

  async verifyRegistration(
    user: User,
    body: any,
    challenge: string,
  ) {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: this.getWebAuthnOrigin(),
      expectedRPID: this.getWebAuthnRpId(),
    });

    if (!verification.verified) {
      throw new UnauthorizedException('Registration verification failed');
    }

    const newAuthenticator = this.authenticatorsRepository.create({
      user,
      credentialID: Buffer.from(verification.registrationInfo.credentialID).toString('base64'),
      credentialPublicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
      counter: verification.registrationInfo.counter,
      transports: body.response.transports?.join(','),
    });

    return this.authenticatorsRepository.save(newAuthenticator);
  }

  async getAuthenticationOptions(user: User, opts?: { biometric?: boolean }) {
    const existingAuthenticators = await this.authenticatorsRepository.find({
      where: { user: { id: user.id } },
    });

    let credentials = existingAuthenticators.map((auth) => ({
      id: Buffer.from(auth.credentialID, 'base64'),
      type: 'public-key' as const,
      transports: auth.transports ? (auth.transports.split(',') as any) : [],
    }));

    if (opts?.biometric) {
      // Platform authenticators report an "internal" transport. Filter the
      // allow-list to those so the OS shows the Face ID / Touch ID / Windows Hello
      // prompt, and require user verification. Transports is often empty in
      // practice, so fall back to all credentials rather than breaking login when
      // none are labelled internal.
      const platformCredentials = credentials.filter((cred) =>
        cred.transports.includes('internal'),
      );
      if (platformCredentials.length > 0) {
        credentials = platformCredentials;
      }
      return generateAuthenticationOptions({
        allowCredentials: credentials,
        userVerification: 'required',
      });
    }

    return generateAuthenticationOptions({ allowCredentials: credentials });
  }

  async verifyAuthentication(
    user: User,
    body: any,
    challenge: string,
  ) {
    const rawCredentialId = typeof body?.id === 'string' ? body.id : '';
    const normalizedCredentialId = this.normalizeCredentialId(rawCredentialId);

    let authenticator = await this.authenticatorsRepository.findOne({
      where: { user: { id: user.id }, credentialID: normalizedCredentialId },
    });

    if (!authenticator) {
      const storedAuthenticators = await this.authenticatorsRepository.find({
        where: { user: { id: user.id } },
      });
      authenticator = storedAuthenticators.find((item) => {
        const stored = this.normalizeCredentialId(item.credentialID);
        return stored === normalizedCredentialId || item.credentialID === rawCredentialId;
      });
    }

    if (!authenticator) {
      throw new UnauthorizedException('Authenticator not found');
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: this.getWebAuthnOrigin(),
      expectedRPID: this.getWebAuthnRpId(),
      authenticator: {
        credentialID: Buffer.from(authenticator.credentialID, 'base64'),
        credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64'),
        counter: authenticator.counter,
        transports: authenticator.transports ? authenticator.transports.split(',') as any : [],
      },
    });

    if (!verification.verified) {
      throw new UnauthorizedException('Authentication verification failed');
    }

    return verification;
  }

  async updateAuthenticatorCounter(authenticationInfo: { credentialID: Uint8Array; newCounter: number }) {
    const authenticator = await this.authenticatorsRepository.findOne({
      where: { credentialID: Buffer.from(authenticationInfo.credentialID).toString('base64') },
    });

    if (!authenticator) {
      throw new UnauthorizedException('Authenticator not found');
    }

    authenticator.counter = authenticationInfo.newCounter;
    return this.authenticatorsRepository.save(authenticator);
  }

  async getPasskeys(user: User) {
    const authenticators = await this.authenticatorsRepository.find({
      where: { user: { id: user.id } },
    });
    return authenticators.map(auth => ({ id: auth.id, name: `Passkey created at ${auth.createdAt.toLocaleString()}` }));
  }

  async deletePasskey(user: User, id: string) {
    const result = await this.authenticatorsRepository.delete({ id, user: { id: user.id } });
    if (result.affected === 0) {
      throw new UnauthorizedException('Passkey not found or you do not have permission to delete it.');
    }
    return { message: 'Passkey deleted successfully.' };
  }
}