export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

export function getSMTPConfig(): SMTPConfig {
  return {
    host: getEnv('SMTP_HOST'),
    port: getEnvNumber('SMTP_PORT', 587),
    secure: getEnvNumber('SMTP_SECURE', 0) === 1,
    user: getEnv('SMTP_USER'),
    pass: getEnv('SMTP_PASS'),
    from: getEnv('SMTP_FROM', 'noreply@pricetracker.local'),
  };
}
