import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { getDataSourceMock } = vi.hoisted(() => ({ getDataSourceMock: vi.fn() }));
vi.mock('@hodfords/typeorm-helper', () => ({
    getDataSource: () => getDataSourceMock()
}));

import { runInTransaction, runInMongoTransaction } from '../../lib/helpers/run-in-transaction.helper.js';
import { CLS_DB_TRANSACTION_NAMESPACE } from '../../lib/constants/cls-transaction.constant.js';
import {
    getCurrentTransactionManager,
    getCurrentTransactionSession,
    isInTransaction,
    markInTransaction
} from '../../lib/helpers/cls-db-transaction.helper.js';
import { runAfterTransactionCommit } from '../../lib/helpers/run-after-transaction-commit.helper.js';

function buildRdbmsDataSource(manager: any = { id: 'manager' }) {
    return {
        manager,
        options: { type: 'postgres' },
        transaction: vi.fn(async (isolationOrCb: any, maybeCb?: any) => {
            const cb = typeof isolationOrCb === 'function' ? isolationOrCb : maybeCb;
            return cb(manager);
        })
    };
}

function buildMongoSession() {
    return {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        abortTransaction: vi.fn().mockResolvedValue(undefined),
        endSession: vi.fn().mockResolvedValue(undefined)
    };
}

function buildMongoDataSource(session: any, manager: any = {}) {
    manager.mongoQueryRunner = {
        databaseConnection: {
            startSession: vi.fn(() => session)
        }
    };
    return {
        manager,
        options: { type: 'mongodb' }
    };
}

beforeEach(() => {
    getDataSourceMock.mockReset();
});

// eslint-disable-next-line max-lines-per-function
describe('runInTransaction', () => {
    it('runs the callback directly when already in a transaction', async () => {
        const fn = vi.fn().mockReturnValue('inner');

        const result = await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
            markInTransaction();
            return runInTransaction(fn, {});
        });

        expect(result).toBe('inner');
        expect(fn).toHaveBeenCalledTimes(1);
        // No data source is needed on the nested path.
        expect(getDataSourceMock).not.toHaveBeenCalled();
    });

    it('wraps the callback in a relational transaction and exposes the manager', async () => {
        const manager = { id: 'rdbms-manager' };
        const dataSource = buildRdbmsDataSource(manager);
        getDataSourceMock.mockReturnValue(dataSource);

        let managerInside: any;
        let inTransactionInside: boolean | undefined;
        const fn = vi.fn(() => {
            managerInside = getCurrentTransactionManager();
            inTransactionInside = isInTransaction();
            return 'ok';
        });

        const result = await runInTransaction(fn, {});

        expect(result).toBe('ok');
        expect(managerInside).toBe(manager);
        expect(inTransactionInside).toBe(true);
        expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('passes the isolation level through to the relational transaction', async () => {
        const dataSource = buildRdbmsDataSource();
        getDataSourceMock.mockReturnValue(dataSource);

        await runInTransaction(vi.fn(), { isolationLevel: 'SERIALIZABLE' });

        expect(dataSource.transaction).toHaveBeenCalledWith('SERIALIZABLE', expect.any(Function));
    });

    it('tolerates an undefined option object on the relational path', async () => {
        const dataSource = buildRdbmsDataSource();
        getDataSourceMock.mockReturnValue(dataSource);

        await runInTransaction(vi.fn().mockReturnValue('ok'), undefined as any);

        expect(dataSource.transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it('clears manager/session and runs commit hooks after a successful transaction', async () => {
        const dataSource = buildRdbmsDataSource();
        getDataSourceMock.mockReturnValue(dataSource);

        const hook = vi.fn().mockResolvedValue(undefined);
        let managerDuring: any;

        await runInTransaction(() => {
            managerDuring = getCurrentTransactionManager();
            runAfterTransactionCommit(hook);
        }, {});

        expect(managerDuring).not.toBeNull();
        expect(hook).toHaveBeenCalledTimes(1);
    });

    it('propagates errors thrown by the callback', async () => {
        const dataSource = buildRdbmsDataSource();
        getDataSourceMock.mockReturnValue(dataSource);

        const failure = new Error('boom');
        await expect(
            runInTransaction(() => {
                throw failure;
            }, {})
        ).rejects.toBe(failure);
    });

    it('uses the mongo transaction path when the data source is mongodb', async () => {
        const session = buildMongoSession();
        const manager: any = {};
        const dataSource = buildMongoDataSource(session, manager);
        getDataSourceMock.mockReturnValue(dataSource);

        let sessionInside: any;
        let managerInside: any;
        const fn = vi.fn(() => {
            sessionInside = getCurrentTransactionSession();
            managerInside = getCurrentTransactionManager();
            return 'mongo-result';
        });

        const result = await runInTransaction(fn, {});

        expect(result).toBe('mongo-result');
        expect(sessionInside).toBe(session);
        expect(managerInside).toBe(manager);
        expect(session.startTransaction).toHaveBeenCalledTimes(1);
        expect(session.commitTransaction).toHaveBeenCalledTimes(1);
        expect(session.endSession).toHaveBeenCalledTimes(1);
    });
});

describe('runInMongoTransaction', () => {
    it('starts, commits and ends the session on success', async () => {
        const session = buildMongoSession();
        const manager: any = {};
        getDataSourceMock.mockReturnValue(buildMongoDataSource(session, manager));

        const fn = vi.fn().mockResolvedValue('done');
        const result = await runInMongoTransaction(fn, {});

        expect(result).toBe('done');
        expect(fn).toHaveBeenCalledWith(session, manager);
        expect(session.startTransaction).toHaveBeenCalledTimes(1);
        expect(session.commitTransaction).toHaveBeenCalledTimes(1);
        expect(session.abortTransaction).not.toHaveBeenCalled();
        expect(session.endSession).toHaveBeenCalledTimes(1);
    });

    it('aborts the transaction and ends the session when the callback throws', async () => {
        const session = buildMongoSession();
        getDataSourceMock.mockReturnValue(buildMongoDataSource(session));

        const failure = new Error('mongo-boom');
        await expect(
            runInMongoTransaction(() => {
                throw failure;
            }, {})
        ).rejects.toBe(failure);

        expect(session.commitTransaction).not.toHaveBeenCalled();
        expect(session.abortTransaction).toHaveBeenCalledTimes(1);
        expect(session.endSession).toHaveBeenCalledTimes(1);
    });
});
