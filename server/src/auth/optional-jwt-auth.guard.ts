import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    // No error, and user is found: return user
    if (!err && user) {
      return user;
    }
    
    // Error or no user: return null, but don't throw an error
    return null;
  }
}