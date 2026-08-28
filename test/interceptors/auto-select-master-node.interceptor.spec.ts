import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { of, lastValueFrom } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AutoSelectMasterNodeInterceptor } from '../../lib/interceptors/auto-select-master-node.interceptor.js';
import { RUNNING_IN_TRANSACTION_WATERMARK } from '../../lib/constants/cls-transaction.constant.js';
import { RUNNING_IN_REPLICATION_MODE_WATERMARK } from '../../lib/constants/cls-replication.constant.js';
import { getCustomReplicationMode } from '../../lib/helpers/cls-db-replication.helper.js';

function buildContext(method: string, handler: () => void = () => {}): ExecutionContext {
    return {
        switchToHttp: () => ({ getRequest: () => ({ method }) }),
        getHandler: () => handler
    } as unknown as ExecutionContext;
}

function buildReflector(metadata: Record<string, unknown> = {}): Reflector {
    return {
        get: vi.fn((key: string) => metadata[key])
    } as unknown as Reflector;
}

describe('AutoSelectMasterNodeInterceptor', () => {
    it('passes GET requests straight through without touching replication', async () => {
        const interceptor = new AutoSelectMasterNodeInterceptor(buildReflector());
        const next: CallHandler = { handle: vi.fn(() => of('get-result')) };

        const result$ = interceptor.intercept(buildContext('GET'), next);

        await expect(lastValueFrom(result$)).resolves.toBe('get-result');
        expect(next.handle).toHaveBeenCalledTimes(1);
    });

    it('passes through handlers already marked as running in a transaction', async () => {
        const reflector = buildReflector({ [RUNNING_IN_TRANSACTION_WATERMARK]: true });
        const interceptor = new AutoSelectMasterNodeInterceptor(reflector);
        const next: CallHandler = { handle: vi.fn(() => of('tx-result')) };

        const result$ = interceptor.intercept(buildContext('POST'), next);

        await expect(lastValueFrom(result$)).resolves.toBe('tx-result');
        expect(next.handle).toHaveBeenCalledTimes(1);
    });

    it('passes through handlers already marked as running in replication mode', async () => {
        const reflector = buildReflector({ [RUNNING_IN_REPLICATION_MODE_WATERMARK]: true });
        const interceptor = new AutoSelectMasterNodeInterceptor(reflector);
        const next: CallHandler = { handle: vi.fn(() => of('replication-result')) };

        const result$ = interceptor.intercept(buildContext('PUT'), next);

        await expect(lastValueFrom(result$)).resolves.toBe('replication-result');
        expect(next.handle).toHaveBeenCalledTimes(1);
    });

    it('wraps non-GET, unmarked requests in a master replication context', async () => {
        const interceptor = new AutoSelectMasterNodeInterceptor(buildReflector());
        let modeWhenHandled: string | undefined;
        const next: CallHandler = {
            handle: vi.fn(() => {
                modeWhenHandled = getCustomReplicationMode();
                return of('write-result');
            })
        };

        const result$ = interceptor.intercept(buildContext('POST'), next);

        await expect(lastValueFrom(result$)).resolves.toBe('write-result');
        expect(modeWhenHandled).toBe('master');
        expect(next.handle).toHaveBeenCalledTimes(1);
    });
});
