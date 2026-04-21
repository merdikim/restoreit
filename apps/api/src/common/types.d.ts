import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      clerkUserId?: string;
    }

    interface Request {
      user?: User | { id: string; email: string; clerkUserId?: string };
    }
  }
}

export {};
