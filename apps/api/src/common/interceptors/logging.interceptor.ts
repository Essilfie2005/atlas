import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();
    const requestId =
      (request.headers['x-request-id'] as string) ??
      Math.random().toString(36).substring(2, 15);

    (request as unknown as Record<string, unknown>)['requestId'] = requestId;

    const { method, url } = request;
    const startTime = Date.now();

    this.logger.log(`→ ${method} ${url} [${requestId}]`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `← ${method} ${url} ${reply.statusCode} +${duration}ms [${requestId}]`,
          );
        },
        error: (err: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `← ${method} ${url} ERROR +${duration}ms [${requestId}]: ${err.message}`,
          );
        },
      }),
    );
  }
}
