// SPDX-License-Identifier: Apache-2.0
import * as dotenv from 'dotenv';
import * as path from 'path';

import { validateProcessorConfig } from '@tazama-lf/frms-coe-lib/lib/config';
import type { AdditionalConfig, ProcessorConfig } from '@tazama-lf/frms-coe-lib/lib/config/processor.config';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

export interface Config {
  PORT: number;
  HOST: string;
}

export const additionalEnvironmentVariables: AdditionalConfig[] = [
  {
    name: 'PORT',
    type: 'number',
  },
  {
    name: 'HOST',
    type: 'string',
  },
];
export const config = validateProcessorConfig(additionalEnvironmentVariables) as ProcessorConfig & Config;
