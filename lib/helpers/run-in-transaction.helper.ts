import { getDataSource } from '@hodfords/typeorm-helper';

import {
    getTransactionCommitHooks,
    isInTransaction,
    markInTransaction,
    markOutOfTransaction,
    setCurrentTransactionManager,
    setCurrentTransactionSession
} from './cls-db-transaction.helper';
import { runInReplication } from './run-in-replication.helper';
import { CLS_DB_TRANSACTION_NAMESPACE } from '../constants/cls-transaction.constant';
import { TransactionHook } from '../types/transaction-hook.type';
import { TransactionalOption } from '../types/transactional-option.type';
import { MongoEntityManager } from 'typeorm';
import { ClientSession } from 'mongodb';

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
    return CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
        let result: any;
        try {
            const dataSource = getDataSource();
            if (dataSource.options.type === 'mongodb') {
                result = await runInMongoTransaction((session: ClientSession, manager: MongoEntityManager) => {
                    markInTransaction();
                    setCurrentTransactionManager(manager);
                    setCurrentTransactionSession(session);
                    return fn();
                }, option);
            } else {
                result = await dataSource.transaction(option?.isolationLevel, (manager) => {
                    markInTransaction();
                    setCurrentTransactionManager(manager);
                    return fn();
                });
            }
            markOutOfTransaction();
            setCurrentTransactionManager(null);
            setCurrentTransactionSession(null);
            await runInReplication('master', async () => {
                await runHooks(getTransactionCommitHooks());
            });
        } catch (error) {
            throw error;
        }

        return result;
    });
}

export async function runInMongoTransaction(fn: any, option: TransactionalOption) {
    const dataSource = getDataSource();
    const manager: MongoEntityManager = dataSource.manager as MongoEntityManager;
    const session = manager.mongoQueryRunner.databaseConnection.startSession();

    let result: any;
    try {
        session.startTransaction();
        result = await fn(session, manager);
        await session.commitTransaction();

        return result;
    } catch (exception) {
        await session.abortTransaction();
        throw exception;
    } finally {
        await session.endSession();
    }
}
