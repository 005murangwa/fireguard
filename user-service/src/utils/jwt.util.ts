
  if (!secret) {

    throw new Error('JWT_SECRET environment variable is not configured');

  }

  return secret;

}



/**

 * Validate and decode a JWT from the Authorization header.

 *

 * @param token - Raw token without "Bearer " prefix

 * @returns Decoded payload when signature and expiry are valid

 * @throws jsonwebtoken.JsonWebTokenError on invalid/expired tokens

 */

export function verifyToken(token: string): JwtPayload {

  const secret = getJwtSecret();

  return jwt.verify(token, secret) as JwtPayload;

}


