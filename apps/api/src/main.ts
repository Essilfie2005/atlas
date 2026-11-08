import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import fastifyHelmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

const startupLogger = new Logger('Bootstrap');

// Universal BigInt serialization for Prisma and Fastify JSON responses
(BigInt.prototype as any).toJSON = function () {
  const int = Number(this);
  return Number.isSafeInteger(int) ? int : this.toString();
};

// ── C3: Guard against weak JWT secret in production ──────────────────────────
const JWT_SECRET = process.env.ATLAS_SIGNING_SECRET ?? '';
const DEFAULT_SECRET = 'atlas-dev-signing-secret-change-in-production';
if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET === DEFAULT_SECRET)) {
  startupLogger.error('FATAL: ATLAS_SIGNING_SECRET is not set or uses the default dev value. Refusing to start in production.');
  process.exit(1);
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      },
    }),
    { bufferLogs: true },
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  const nodeEnv = configService.get<string>('nodeEnv') ?? 'development';

  // Global prefix /v1 — health excluded
  app.setGlobalPrefix('v1', {
    exclude: ['/health'],
  });

  // CORS
  const configuredOrigins = configService.get<string[]>('cors.origins') ?? [];
  const corsOrigin = configuredOrigins.length > 0 ? configuredOrigins : true;

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-idempotency-key',
    ],
    credentials: true,
  });

  // H1: Security headers via Helmet
  // L1: HSTS enforces HTTPS for 1 year including subdomains
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (app as any).register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,        // 1 year
      includeSubDomains: true,
      preload: true,
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images from other origins
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // M2: Swagger only in non-production
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ATLAS Payment API')
      .setDescription('Pan-African Payment Infrastructure — REST API v1')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'API Key' },
        'api-key',
      )
      .addTag('auth', 'API key management')
      .addTag('merchants', 'Merchant profile management')
      .addTag('payment-intents', 'Payment intent lifecycle')
      .addTag('payouts', 'Payout and beneficiary management')
      .addTag('webhooks', 'Webhook event management')
      .addTag('settlements', 'Settlement reconciliation')
      .addTag('health', 'Health and status checks')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    startupLogger.log(`📖 Swagger docs at http://0.0.0.0:${port}/docs`);
  }

  await app.listen(port, '0.0.0.0');
  startupLogger.log(`🚀 ATLAS API running on http://0.0.0.0:${port}/v1`);
}

bootstrap();
