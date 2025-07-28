import { getDataSource } from '@hodfords/typeorm-helper';

import {
    getTransactionCommitHooks,
    isInTransaction,
    markInTransaction,
    markOutOfTransaction,
    setCurrentTransactionManager
} from './cls-db-transaction.helper';
import { runInReplication } from './run-in-replication.helper';
import { CLS_DB_TRANSACTION_NAMESPACE } from '../constants/cls-transaction.constant';
import { TransactionHook } from '../types/transaction-hook.type';
import { TransactionalOption } from '../types/transactional-option.type';

async function runHooks(hooks: TransactionHook[]) {
    for (const hook of hooks.filter((h) => !h.executed)) {
        hook.executed = true;
        await hook.fn();
    }
}

export async function runInTransaction(fn: any, option: TransactionalOption) {
    if (isInTransaction()) {
        return fn();
    }
    return CLS_DB_TRANSACTION_NAMESPACE.runAndReturn(async () => {
        const dataSource = getDataSource();
        let result: any;
        try {
            result = await dataSource.transaction(option?.isolationLevel, (manager) => {
                markInTransaction();
                setCurrentTransactionManager(manager);
                return fn();
            });
            markOutOfTransaction();
            setCurrentTransactionManager(null);
            await runInReplication('master', async () => {
                await runHooks(getTransactionCommitHooks());
            });
        } catch (error) {
            throw error;
        }

        return result;
    });
}
