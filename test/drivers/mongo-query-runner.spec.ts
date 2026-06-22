import 'reflect-metadata';
import { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';
import { CustomMongoQueryRunner } from '../../lib/drivers/mongo-query-runner';
import { CLS_DB_TRANSACTION_NAMESPACE } from '../../lib/constants/cls-transaction.constant';
import { CLS_DB_REPLICATION_NAMESPACE } from '../../lib/constants/cls-replication.constant';
import {
    markInTransaction,
    setCurrentTransactionSession
} from '../../lib/helpers/cls-db-transaction.helper';
import { markInCustomReplication } from '../../lib/helpers/cls-db-replication.helper';

function createRunner(): CustomMongoQueryRunner {
    return Object.create(CustomMongoQueryRunner.prototype) as CustomMongoQueryRunner;
}

describe('CustomMongoQueryRunner', () => {
    describe('getOptions', () => {
        it('returns the options untouched when outside any transaction or replication', () => {
            const runner = createRunner();
            const options = { foo: 'bar' };
            expect(runner.getOptions(options)).toEqual({ foo: 'bar' });
        });

        it('defaults to an empty object when no options are provided', () => {
            const runner = createRunner();
            expect(runner.getOptions()).toEqual({});
        });

        it('attaches the session and primary read preference while in a transaction', async () => {
            const runner = createRunner();
            const session = { id: 'session' };

            await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
                markInTransaction();
                setCurrentTransactionSession(session);

                expect(runner.getOptions({ existing: 1 })).toEqual({
                    existing: 1,
                    session,
                    readPreference: 'primary'
                });
            });
        });

        it('uses primaryPreferred read preference for the master replication mode', async () => {
            const runner = createRunner();

            await CLS_DB_REPLICATION_NAMESPACE.run(async () => {
                markInCustomReplication('master');
                expect(runner.getOptions()).toEqual({ readPreference: 'primaryPreferred' });
            });
        });

        it('uses secondaryPreferred read preference for the slave replication mode', async () => {
            const runner = createRunner();

            await CLS_DB_REPLICATION_NAMESPACE.run(async () => {
                markInCustomReplication('slave');
                expect(runner.getOptions({ keep: true })).toEqual({
                    keep: true,
                    readPreference: 'secondaryPreferred'
                });
            });
        });
    });

    describe('methods that delegate to the parent query runner', () => {
        const session = { id: 'tx-session' };

        // Each tuple: [method, argumentsBeforeOptions, parentMethodSpiedOn]
        const cases: Array<[string, unknown[], string]> = [
            ['aggregate', ['col', [{ $match: {} }]], 'aggregate'],
            ['count', ['col', {}], 'count'],
            ['countDocuments', ['col', {}], 'countDocuments'],
            ['deleteOne', ['col', {}], 'deleteOne'],
            ['deleteMany', ['col', {}], 'deleteMany'],
            ['distinct', ['col', 'key', {}], 'distinct'],
            ['findOneAndDelete', ['col', {}], 'findOneAndDelete'],
            ['findOneAndReplace', ['col', {}, { a: 1 }], 'findOneAndReplace'],
            ['findOneAndUpdate', ['col', {}, { $set: {} }], 'findOneAndUpdate'],
            ['insertMany', ['col', [{ a: 1 }]], 'insertMany'],
            ['insertOne', ['col', { a: 1 }], 'insertOne'],
            ['replaceOne', ['col', {}, { a: 1 }], 'replaceOne'],
            ['stats', ['col'], 'stats'],
            ['watch', ['col', []], 'watch'],
            ['updateMany', ['col', {}, { $set: {} }], 'updateMany'],
            ['updateOne', ['col', {}, { $set: {} }], 'updateOne']
        ];

        it.each(cases)(
            '%s injects the resolved options and forwards to the parent',
            async (method, argsBeforeOptions, parentMethod) => {
                const spy = jest
                    .spyOn(MongoQueryRunner.prototype as any, parentMethod)
                    .mockResolvedValue('result' as never);
                const runner = createRunner();

                await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
                    markInTransaction();
                    setCurrentTransactionSession(session);
                    await (runner as any)[method](...argsBeforeOptions);
                });

                expect(spy).toHaveBeenCalledTimes(1);
                const passedOptions = spy.mock.calls[0][spy.mock.calls[0].length - 1];
                expect(passedOptions).toMatchObject({ session, readPreference: 'primary' });
                spy.mockRestore();
            }
        );

        it('bulkWrite resolves options and forwards to the parent bulkWrite', async () => {
            const spy = jest.spyOn(MongoQueryRunner.prototype as any, 'bulkWrite').mockResolvedValue('bulk' as never);
            const runner = createRunner();
            const operations = [{ insertOne: { document: { a: 1 } } }];

            await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
                markInTransaction();
                setCurrentTransactionSession(session);
                await runner.bulkWrite('col', operations as any);
            });

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toBe('col');
            expect(spy.mock.calls[0][1]).toBe(operations);
            expect(spy.mock.calls[0][2]).toMatchObject({ session, readPreference: 'primary' });
            spy.mockRestore();
        });
    });

    describe('methods that operate on the collection directly', () => {
        it('cursor calls find on the collection with the resolved options', () => {
            const runner = createRunner();
            const find = jest.fn().mockReturnValue('cursor');
            jest.spyOn(runner as any, 'getCollection').mockReturnValue({ find });

            const filter = { name: 'x' };
            const result = runner.cursor('col', filter as any);

            expect(result).toBe('cursor');
            expect(find).toHaveBeenCalledWith(filter, {});
        });

        it('cursor defaults the filter to an empty object', () => {
            const runner = createRunner();
            const find = jest.fn().mockReturnValue('cursor');
            jest.spyOn(runner as any, 'getCollection').mockReturnValue({ find });

            runner.cursor('col', undefined as any);

            expect(find).toHaveBeenCalledWith({}, {});
        });

        it('initializeOrderedBulkOp passes resolved options to the collection', () => {
            const runner = createRunner();
            const initializeOrderedBulkOp = jest.fn().mockReturnValue('ordered');
            jest.spyOn(runner as any, 'getCollection').mockReturnValue({ initializeOrderedBulkOp });

            expect(runner.initializeOrderedBulkOp('col')).toBe('ordered');
            expect(initializeOrderedBulkOp).toHaveBeenCalledWith({});
        });

        it('initializeUnorderedBulkOp passes resolved options to the collection', () => {
            const runner = createRunner();
            const initializeUnorderedBulkOp = jest.fn().mockReturnValue('unordered');
            jest.spyOn(runner as any, 'getCollection').mockReturnValue({ initializeUnorderedBulkOp });

            expect(runner.initializeUnorderedBulkOp('col')).toBe('unordered');
            expect(initializeUnorderedBulkOp).toHaveBeenCalledWith({});
        });
    });
});
