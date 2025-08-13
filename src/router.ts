// SPDX-License-Identifier: Apache-2.0

import type { FastifyInstance } from 'fastify';
import { LoginHandler, handleHealthCheck } from './app.controller';
import SetOptions from './utils/schemaOptions';

function Routes(fastify: FastifyInstance, options: unknown): void {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);
  fastify.post('/v1/auth/login', SetOptions(LoginHandler, 'credentialsSchema'));
}

export default Routes;
