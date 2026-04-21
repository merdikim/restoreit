import { createClerkClient } from '@clerk/backend';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { AuthService } from '../../auth/auth.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const authorizedParty = this.toAuthorizedParty(frontendUrl);
    const clerk = createClerkClient({
      secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
      publishableKey: this.configService.get<string>('CLERK_PUBLISHABLE_KEY'),
    });

    try {
      const requestState = await clerk.authenticateRequest(request as never, {
        jwtKey: this.configService.get<string>('CLERK_JWT_KEY'),
        authorizedParties: authorizedParty ? [authorizedParty] : undefined,
      });

      if (!requestState.isAuthenticated) {
        throw new UnauthorizedException(requestState.message ?? 'Invalid token');
      }

      const auth = requestState.toAuth();
      if (!('userId' in auth) || !auth.userId) {
        throw new UnauthorizedException('Missing Clerk user');
      }

      const clerkUser = await clerk.users.getUser(auth.userId);
      const email =
        clerkUser.emailAddresses.find((emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId)
          ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        throw new UnauthorizedException('Clerk user is missing a primary email');
      }

      const localUser = await this.authService.syncClerkUser(clerkUser.id, email);
      request.user = {
        id: localUser.id,
        email: localUser.email,
        clerkUserId: clerkUser.id,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid token');
    }
  }

  private toAuthorizedParty(frontendUrl: string) {
    try {
      return new URL(frontendUrl).origin;
    } catch {
      return null;
    }
  }
}
