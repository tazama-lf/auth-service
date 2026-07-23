// SPDX-License-Identifier: Apache-2.0
import { verifyToken } from '@tazama-lf/auth-lib/lib/services/jwtService';
import { extractTenant, type TazamaToken } from '@tazama-lf/auth-lib';
import { loggerService } from '..';
import type { AuthenticationResult, AuthError } from '../interfaces/auth';
import { StatusCodes } from '../interfaces/statusCodes';

/**
 * Authenticates and authorizes the request by validating the authorization header,
 * extracting and verifying the token, and validating the tenant.
 * @param authorizationHeader - The authorization header from the request
 * @returns AuthenticationResult containing either the decoded token or error details
 */
export const authenticateRequest = (authorizationHeader: string | undefined): AuthenticationResult => {
  const unauthorized = (message: string): AuthError => ({
    success: false,
    statusCode: StatusCodes.UNAUTHORIZED,
    message,
  });

  if (!authorizationHeader) return unauthorized('Authorization header is missing');

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return unauthorized('Bearer token is missing or malformed');
  }

  try {
    const decodedToken = verifyToken(token) as TazamaToken;
    const tenantResponse = extractTenant(true, authorizationHeader);

    if (!tenantResponse.success) {
      return unauthorized('Tenant response is not successful(false)');
    }

    return { success: true, decodedToken };
  } catch (err) {
    const error = err as Error;
    loggerService.error(`Token verification failed: ${error.message}`, 'authenticateRequest');

    // Return unauthorized for authentication/authorization errors
    if (
      error.message.includes('jwt') ||
      error.message.includes('token') ||
      error.message.includes('expired') ||
      error.message.includes('invalid') ||
      error.message.includes('signature') ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      return unauthorized('Unauthorized');
    }

    // Throw other errors
    throw err;
  }
};
