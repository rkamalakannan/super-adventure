import type { Config } from 'drizzle-kit';
import { getAppConfig } from '../src/config/env';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getAppConfig().dbUrl,
  },
} satisfies Config;