export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: { url: string };
  redis: { url: string };
  rabbitmq: { url: string };
  atlas: { signingSecret: string; apiVersion: string };
  paystack: { secretKey: string; publicKey: string };
  cors: { origins: string[] };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://atlas:atlas@localhost:5432/atlas',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  },
  atlas: {
    signingSecret: process.env.ATLAS_SIGNING_SECRET ?? 'change-me-in-production',
    apiVersion: process.env.ATLAS_API_VERSION ?? '2024-01-01',
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY ?? '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY ?? '',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  },
});
