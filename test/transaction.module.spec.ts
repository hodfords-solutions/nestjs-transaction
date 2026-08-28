import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransactionModule } from '../lib/transaction.module.js';
import { AutoSelectMasterNodeInterceptor } from '../lib/interceptors/auto-select-master-node.interceptor.js';

describe('TransactionModule.forRoot', () => {
    it('returns a dynamic module bound to TransactionModule with no providers by default', () => {
        const dynamicModule = TransactionModule.forRoot();

        expect(dynamicModule.module).toBe(TransactionModule);
        expect(dynamicModule.providers).toEqual([]);
        expect(dynamicModule.exports).toEqual([]);
    });

    it('returns no providers when called without arguments', () => {
        const dynamicModule = TransactionModule.forRoot();
        expect(dynamicModule.providers).toHaveLength(0);
    });

    it('does not register the interceptor when the option is disabled', () => {
        const dynamicModule = TransactionModule.forRoot({ autoUseMasterNodeForChangeRequest: false });
        expect(dynamicModule.providers).toHaveLength(0);
    });

    it('registers the auto-select master node interceptor when the option is enabled', () => {
        const dynamicModule = TransactionModule.forRoot({ autoUseMasterNodeForChangeRequest: true });

        expect(dynamicModule.providers).toHaveLength(1);
        expect(dynamicModule.providers).toContainEqual({
            provide: APP_INTERCEPTOR,
            useClass: AutoSelectMasterNodeInterceptor
        });
    });
});
