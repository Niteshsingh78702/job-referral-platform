import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../constants';
import * as crypto from 'crypto';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const ip = request.ip || request.headers['x-forwarded-for'];
    const userAgent = request.headers['user-agent'];

    // Determine action based on method
    let action: AuditAction;
    switch (method) {
      case 'POST':
        action = AuditAction.CREATE;
        break;
      case 'PUT':
      case 'PATCH':
        action = AuditAction.UPDATE;
        break;
      case 'DELETE':
        action = AuditAction.DELETE;
        break;
      default:
        return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        // Only log mutations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          try {
            await this.prisma.auditLog.create({
              data: {
                id: crypto.randomUUID(),
                userId: user?.sub || user?.id,
                action,
                entityType: this.extractEntityType(url),
                entityId: response?.id || response?.data?.id || 'unknown',
                newValue: method !== 'DELETE' ? response : undefined,
                metadata: {
                  ip,
                  userAgent,
                  url,
                  method,
                },
              },
            });
          } catch (error) {
            // Don't fail the request if audit logging fails
            console.error('Audit log failed:', error);
          }
        }
      }),
    );
  }

  private extractEntityType(url: string): string {
    // Extract entity type from URL (e.g., /api/v1/jobs/123 -> Job)
    const parts = url.split('/').filter(Boolean);
    const entityIndex = parts.findIndex((p) => p === 'v1') + 1;
    const entity = parts[entityIndex] || 'Unknown';
    return entity.charAt(0).toUpperCase() + entity.slice(1, -1);
  }
}
