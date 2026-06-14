import { JwtPayload } from './common.types';

// Express Request with user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'customer' | 'agent' | 'admin';
        iat?: number;
        exp?: number;
      };
    }
  }
}

// Export for module augmentation
export {};
