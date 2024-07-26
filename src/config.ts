// SPDX-License-Identifier: Apache-2.0
import * as dotenv from 'dotenv';
import * as path from 'path';

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
  app: process.env.FUNCTION_NAME! || 'auth-service',
  env: process.env.NODE_ENV!,
  service: {
    port: parseInt(process.env.PORT!, 10) || 3000,
    host: process.env.HOST! || '127.0.0.1',
  },
};
