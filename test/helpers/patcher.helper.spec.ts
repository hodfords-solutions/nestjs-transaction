import 'reflect-metadata';
import { DataSource, Repository, MongoRepository, SelectQueryBuilder } from 'typeorm';
import { BaseQueryRunner } from 'typeorm/query-runner/BaseQueryRunner';
// Importing the helper applies the prototype patches as a side effect.
import '../../lib/helpers/patcher.helper';
import { CLS_DB_TRANSACTION_NAMESPACE } from '../../lib/constants/cls-transaction.constant';
import { CLS_DB_REPLICATION_NAMESPACE } from '../../lib/constants/cls-replication.constant';
import { markInTransaction, setCurrentTransactionManager } from '../../lib/helpers/cls-db-transaction.helper';
import { markInCustomReplication } from '../../lib/helpers/cls-db-replication.helper';

// eslint-disable-next-line max-lines-per-function
describe('patcher.helper', () => {
    describe('patched manager accessor', () => {
        const prototypes: Array<[string, any]> = [
            ['Repository', Repository.prototype],
            ['MongoRepository', MongoRepository.prototype],
            ['BaseQueryRunner', BaseQueryRunner.prototype],
            ['DataSource', DataSource.prototype]
        ];

        it.each(prototypes)('%s returns the default manager outside a transaction', (name, proto) => {
            const instance = Object.create(proto);
            const defaultManager = { id: 'default' };
            instance.manager = defaultManager;

            expect(instance.defaultManager).toBe(defaultManager);
            expect(instance.manager).toBe(defaultManager);
        });

        it.each(prototypes)('%s returns the transaction manager inside a transaction', async (name, proto) => {
            const instance = Object.create(proto);
            instance.manager = { id: 'default' };
            const txManager = { id: 'tx' };

            await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
                markInTransaction();
                setCurrentTransactionManager(txManager);
                expect(instance.manager).toBe(txManager);
            });
        });
    });

    describe('patched SelectQueryBuilder.queryRunner accessor', () => {
        it('returns the transaction manager queryRunner inside a transaction', async () => {
            const qb = Object.create(SelectQueryBuilder.prototype);
            const queryRunner = { id: 'qr' };

            await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
                markInTransaction();
                setCurrentTransactionManager({ queryRunner });
                expect(qb.queryRunner).toBe(queryRunner);
            });
        });

        it('prefers the mongo query runner when present', async () => {
            const qb = Object.create(SelectQueryBuilder.prototype);
            const mongoQueryRunner = { id: 'mongo-qr' };

            await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
                markInTransaction();
                setCurrentTransactionManager({ mongoQueryRunner, queryRunner: { id: 'qr' } });
                expect(qb.queryRunner).toBe(mongoQueryRunner);
            });
        });

        it('returns the bound query runner outside a transaction', () => {
            const qb = Object.create(SelectQueryBuilder.prototype);
            const queryRunner = { id: 'bound-qr' };
            qb.queryRunner = queryRunner;
            expect(qb.defaultQueryRunner).toBe(queryRunner);
            expect(qb.queryRunner).toBe(queryRunner);
        });

        it('never resolves the query runner from the default manager outside a transaction', () => {
            const qb = Object.create(SelectQueryBuilder.prototype);
            qb.defaultManager = { id: 'default-manager' };
            expect(qb.queryRunner).toBeUndefined();
        });
    });

    describe('patched DataSource.query', () => {
        it('injects the current transaction query runner when none is provided', async () => {
            const dataSource = Object.create(DataSource.prototype);
            const query = jest.fn().mockResolvedValue('rows');
            const release = jest.fn();
            const queryRunner = { isReleased: false, query, release };

            const result = await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
                markInTransaction();
                setCurrentTransactionManager({ queryRunner });
                return dataSource.query('SELECT 1');
            });

            expect(result).toBe('rows');
            expect(query).toHaveBeenCalledWith('SELECT 1', undefined);
            // Because a query runner was injected, the original should not release it.
            expect(release).not.toHaveBeenCalled();
        });
    });

    describe('patched DataSource.createQueryRunner', () => {
        function buildDataSource() {
            const dataSource = Object.create(DataSource.prototype);
            dataSource.driver = { createQueryRunner: jest.fn((mode: string) => ({ mode })) };
            dataSource.createEntityManager = jest.fn(() => ({ id: 'entity-manager' }));
            return dataSource;
        }

        it('uses the requested mode when not in a transaction or custom replication', () => {
            const dataSource = buildDataSource();
            dataSource.createQueryRunner('slave');
            expect(dataSource.driver.createQueryRunner).toHaveBeenCalledWith('slave');
        });

        it('defaults to master mode when nothing is requested', () => {
            const dataSource = buildDataSource();
            dataSource.createQueryRunner();
            expect(dataSource.driver.createQueryRunner).toHaveBeenCalledWith('master');
        });

        it('overrides the requested mode with the custom replication mode', async () => {
            const dataSource = buildDataSource();
            await CLS_DB_REPLICATION_NAMESPACE.run(async () => {
                markInCustomReplication('slave');
                dataSource.createQueryRunner('master');
            });
            expect(dataSource.driver.createQueryRunner).toHaveBeenCalledWith('slave');
        });

        it('keeps the requested mode when inside a transaction', async () => {
            const dataSource = buildDataSource();
            await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
                markInTransaction();
                dataSource.createQueryRunner('slave');
            });
            expect(dataSource.driver.createQueryRunner).toHaveBeenCalledWith('slave');
        });
    });
});
