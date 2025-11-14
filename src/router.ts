// SPDX-License-Identifier: Apache-2.0

import type { FastifyInstance } from 'fastify';
import { FetchGroup, FetchUsersByRoleHandler, LoginHandler, handleHealthCheck } from './app.controller';
import SetOptions from './utils/schemaOptions';

function Routes(fastify: FastifyInstance, options: unknown): void {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);
  fastify.post('/v1/auth/login', SetOptions(LoginHandler, 'credentialsSchema'));

  fastify.get('/v1/auth/user/:rolename', FetchUsersByRoleHandler);

  //new route
  fastify.get('/v1/auth', FetchGroup);
}

export default Routes;
