// SPDX-License-Identifier: Apache-2.0
import { fastifyCors } from '@fastify/cors';
import Ajv from 'ajv';
import Fastify, { type FastifyInstance } from 'fastify';
import Routes from '../router';
import credentialsJson from '../schemas/credentials.json';

const credentialsSchema = { ...credentialsJson, $id: 'credentialsSchema' };

const fastify = Fastify();

const ajv = new Ajv({
  removeAdditional: 'all',
  useDefaults: true,
  coerceTypes: 'array',
  strictTuples: false,
});

ajv.addSchema(credentialsSchema);

export default async function initializeFastifyClient(): Promise<FastifyInstance> {
  fastify.addSchema(credentialsSchema);

  fastify.setValidatorCompiler(({ schema }) => ajv.compile(schema));
  await fastify.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: '*',
  });
  fastify.register(Routes);
  await fastify.ready();
  return await fastify;
}

export async function destroyFasityClient(): Promise<void> {
  await fastify.close();
}
