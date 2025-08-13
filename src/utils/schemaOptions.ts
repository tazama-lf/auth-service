// SPDX-License-Identifier: Apache-2.0
import type { RouteHandlerMethod } from 'fastify';
import type { FastifySchema } from 'fastify/types/schema';

const SetOptions = (handler: RouteHandlerMethod, schemaName: string): { handler: RouteHandlerMethod; schema: FastifySchema } => ({
    handler,
    schema: { body: { $ref: `${schemaName}#` } },
  });

export default SetOptions;
