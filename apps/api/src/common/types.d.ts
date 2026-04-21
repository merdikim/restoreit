declare global {
  namespace Express {
    interface User {
      id: string;
      clerkUserId?: string;
    }

    interface Request {
      user?: { id: string; clerkUserId?: string };
    }
  }
}

export {};
