declare global {
  namespace Express {
    interface User {
      id: string;
    }

    interface Request {
      user?: { id: string; };
    }
  }
}

export {};
