import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { RUNNING_IN_TRANSACTION_WATERMARK } from '../constants/cls-transaction.constant';
import { runInReplication } from '../helpers/run-in-replication.helper';
import {
    CLS_DB_REPLICATION_NAMESPACE,
    RUNNING_IN_REPLICATION_MODE_WATERMARK
} from '../constants/cls-replication.constant';

@Injectable()
export class AutoSelectMasterNodeInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        if (request.method === 'GET') {
            return next.handle();
        }
        const handler = context.getHandler();
        const isRunWithTransaction = this.reflector.get<string>(RUNNING_IN_TRANSACTION_WATERMARK, handler);
        if (isRunWithTransaction) {
            return next.handle();
        }
        const isRunWithReplication = this.reflector.get<string>(RUNNING_IN_REPLICATION_MODE_WATERMARK, handler);
        if (isRunWithReplication) {
            return next.handle();
        }
        return CLS_DB_REPLICATION_NAMESPACE.runAndReturn(() => {
            return runInReplication('master', () => {
                return next.handle();
            });
        });
    }
}
