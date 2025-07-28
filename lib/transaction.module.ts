import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AutoSelectMasterNodeInterceptor } from './interceptors/auto-select-master-node.interceptor';
import { TransactionOption } from './types/transaction-option.type';

@Module({})
export class TransactionModule {
    static forRoot(option: TransactionOption = {}): DynamicModule {
        const providers = [];
        if (option.autoUseMasterNodeForChangeRequest) {
            providers.push({
                provide: APP_INTERCEPTOR,
                useClass: AutoSelectMasterNodeInterceptor
            });
        }

        return {
            module: TransactionModule,
            providers,
            exports: []
        };
    }
}
