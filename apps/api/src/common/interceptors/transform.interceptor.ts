import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyRequest } from 'fastify';

export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

function serializeBigInts(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') {
    const num = Number(value);
    return Number.isSafeInteger(num) ? num : value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeBigInts);
  }
  if (typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      result[key] = serializeBigInts(value[key]);
    }
    return result;
  }
  return value;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest>();
    const requestId =
      ((request as unknown as Record<string, unknown>)[
        'requestId'
      ] as string) ??
      (request.headers['x-request-id'] as string) ??
      Math.random().toString(36).substring(2, 15);

    return next.handle().pipe(
      map((data) => ({
        data: serializeBigInts(data),
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
