import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../../types/common.types';
import jwtConfig from '../../config/jwt.config';

// JWT Service Class
export class JwtService {
  // Generate access token
  static generateAccessToken(payload: JwtPayload): string {
    const opts: SignOptions = { expiresIn: jwtConfig.accessTokenExpiry as any };
    return jwt.sign(payload as object, jwtConfig.accessTokenSecret, opts);
  }

  // Generate refresh token
  static generateRefreshToken(payload: JwtPayload): string {
    const opts: SignOptions = { expiresIn: jwtConfig.refreshTokenExpiry as any };
    return jwt.sign(payload as object, jwtConfig.refreshTokenSecret, opts);
  }

  // Verify access token
  static verifyAccessToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, jwtConfig.accessTokenSecret) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, jwtConfig.refreshTokenSecret) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Decode token without verification
  static decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

// Export default
export default JwtService;
