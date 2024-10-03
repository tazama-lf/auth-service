// SPDX-License-Identifier: Apache-2.0
import * as dotenv from 'dotenv';
import * as path from 'path';

import { validateEnvVar } from '@tazama-lf/frms-coe-lib/lib/helpers/env';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

export interface IConfig {
  app: string;
  env: string;
  service: {
    port: number;
    host: string;
  };
}

export const configuration: IConfig = {
  app: validateEnvVar<string>('FUNCTION_NAME', 'string'),
  env: validateEnvVar<string>('NODE_ENV', 'string'),
  service: {
    port: validateEnvVar<number>('PORT', 'number', true) || 3000,
    host: validateEnvVar<string>('HOST', 'string'),
  },
};
