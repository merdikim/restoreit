import { createClerkClient } from '@clerk/backend';
import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { URL } from 'node:url';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const authorizedParty = this.toAuthorizedParty(frontendUrl);
    const clerk = createClerkClient({
      secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
      publishableKey: this.configService.get<string>('CLERK_PUBLISHABLE_KEY'),
    });
    const clerkRequest = this.toClerkRequest(request);

    try {
      const requestState = await clerk.authenticateRequest(clerkRequest, {
        secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
        authorizedParties:  [authorizedParty]
      });

      if (!requestState.isAuthenticated) {
        throw new UnauthorizedException(requestState.message ?? 'Invalid token');
      }

      const auth = requestState.toAuth();
      if (!('userId' in auth) || !auth.userId) {
        throw new UnauthorizedException('Missing Clerk user');
      }

      request.user = { id: auth.userId };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(error instanceof Error ? error.message : 'Invalid token');
    }
  }

  private toClerkRequest(request: Request) {
    const baseUrl = this.getRequestBaseUrl(request);
    const absoluteUrl = new URL(request.originalUrl || request.url, baseUrl);

    return new Request(absoluteUrl, {
      method: request.method,
      headers: new Headers(this.normalizeHeaders(request)),
    });
  }

  private toAuthorizedParty(frontendUrl: string) {
    try {
      return new URL(frontendUrl).origin;
    } catch {
      return '';
    }
  }

  private getRequestBaseUrl(request: Request) {
    const forwardedProto = this.getFirstHeaderValue(request.headers['x-forwarded-proto']);
    const forwardedHost = this.getFirstHeaderValue(request.headers['x-forwarded-host']);
    const host = forwardedHost ?? this.getFirstHeaderValue(request.headers.host);

    if (host) {
      return `${forwardedProto ?? request.protocol ?? 'http'}://${host}`;
    }

    return this.configService.get<string>('APP_URL', 'http://localhost:4000');
  }

  private normalizeHeaders(request: Request) {
    const headers: Record<string, string> = {};

    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
        continue;
      }

      if (Array.isArray(value)) {
        headers[key] = value.join(', ');
      }
    }

    return headers;
  }

  private getFirstHeaderValue(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }
}
