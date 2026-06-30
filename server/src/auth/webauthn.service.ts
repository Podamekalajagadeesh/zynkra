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

  async getRegistrationOptions(user: User) {
    const existingAuthenticators = await this.authenticatorsRepository.find({
      where: { user: { id: user.id } },
    });

    return generateRegistrationOptions({
      rpName: 'Zynkra',
      rpID: this.configService.get<string>('WEBAUTHN_RP_ID', 'localhost'),
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
      expectedOrigin: this.configService.get<string>('WEBAUTHN_ORIGIN', 'http://localhost:5173'),
      expectedRPID: this.configService.get<string>('WEBAUTHN_RP_ID', 'localhost'),
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

  async getAuthenticationOptions(user: User) {
    const existingAuthenticators = await this.authenticatorsRepository.find({
      where: { user: { id: user.id } },
    });

    return generateAuthenticationOptions({
      allowCredentials: existingAuthenticators.map((auth) => ({
        id: Buffer.from(auth.credentialID, 'base64'),
        type: 'public-key',
        transports: auth.transports ? auth.transports.split(',') as any : [],
      })),
    });
  }

  async verifyAuthentication(
    user: User,
    body: any,
    challenge: string,
  ) {
    const authenticator = await this.authenticatorsRepository.findOne({
      where: { user: { id: user.id }, credentialID: body.id },
    });

    if (!authenticator) {
      throw new UnauthorizedException('Authenticator not found');
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: this.configService.get<string>('WEBAUTHN_ORIGIN', 'http://localhost:5173'),
      expectedRPID: this.configService.get<string>('WEBAUTHN_RP_ID', 'localhost'),
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