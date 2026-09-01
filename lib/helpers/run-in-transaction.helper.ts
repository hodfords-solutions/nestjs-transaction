import { getDataSource } from '@hodfords/typeorm-helper';

import {
    getTransactionCommitHooks,
    isInTransaction,
    markInTransaction,
    markOutOfTransaction,
    setCurrentTransactionManager,
    setCurrentTransactionSession
} from './cls-db-transaction.helper.js';
import { runInReplication } from './run-in-replication.helper.js';
import { CLS_DB_TRANSACTION_NAMESPACE } from '../constants/cls-transaction.constant.js';
import { TransactionHook } from '../types/transaction-hook.type.js';
import { TransactionalOption } from '../types/transactional-option.type.js';
import { EntityManager, MongoEntityManager } from 'typeorm';
import { ClientSession } from 'mongodb';

function requireDataSource() {
    const dataSource = getDataSource();
    if (!dataSource) {
        throw new Error('No data source has been registered. Make sure TransactionModule is imported.');
    }

    return dataSource;
}

async function runHooks(hooks: TransactionHook[]) {
    for (const hook of hooks.filter((h) => !h.executed)) {
        hook.executed = true;
        await hook.fn();
    }
}

export async function runInTransaction<T>(fn: () => T | Promise<T>, option: TransactionalOption = {}): Promise<T> {
    if (isInTransaction()) {
        return fn();
    }
    return CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
        let result: T;
        try {
            const dataSource = requireDataSource();
            if (dataSource.options.type === 'mongodb') {
                result = await runInMongoTransaction((session: ClientSession, manager: MongoEntityManager) => {
                    markInTransaction();
                    setCurrentTransactionManager(manager);
                    setCurrentTransactionSession(session);
                    return fn();
                }, option);
            } else {
                const runInManager = async (manager: EntityManager): Promise<T> => {
                    markInTransaction();
                    setCurrentTransactionManager(manager);
                    return fn();
                };
                result = option?.isolationLevel
                    ? await dataSource.transaction(option.isolationLevel, runInManager)
                    : await dataSource.transaction(runInManager);
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

export async function runInMongoTransaction(fn: any, option: TransactionalOption = {}) {
    const dataSource = requireDataSource();
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
