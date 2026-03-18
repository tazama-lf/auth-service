// SPDX-License-Identifier: Apache-2.0
import type { TazamaToken } from '@tazama-lf/auth-lib';
import type { StatusCodes } from './statusCodes';

export interface AuthResult {
  success: true;
  decodedToken: TazamaToken;
}

export interface AuthError {
  success: false;
  statusCode: StatusCodes;
  message: string;
}

export type AuthenticationResult = AuthResult | AuthError;
