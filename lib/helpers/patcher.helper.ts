import {
    DataSource,
    EntityManager,
    MongoRepository,
    ObjectLiteral,
    QueryRunner,
    ReplicationMode,
    Repository,
    SelectQueryBuilder
} from 'typeorm';
import { getCurrentTransactionManager, isInTransaction } from './cls-db-transaction.helper.js';
import { BaseQueryRunner } from 'typeorm/query-runner/BaseQueryRunner.js';
import { getCustomReplicationMode } from './cls-db-replication.helper.js';
import { PostgresQueryRunner } from 'typeorm/driver/postgres/PostgresQueryRunner.js';

function patchManager(repositoryType: unknown) {
    Object.defineProperty(repositoryType, 'manager', {
        configurable: true,
        get() {
            if (isInTransaction()) {
                return getCurrentTransactionManager();
            }
            return this.defaultManager;
        },
        set(manager: EntityManager | undefined) {
            this.defaultManager = manager;
        }
    });
}

function patchQueryRunner(repositoryType: unknown) {
    Object.defineProperty(repositoryType, 'queryRunner', {
        configurable: true,
        get() {
            if (isInTransaction()) {
                const manager = getCurrentTransactionManager();
                return manager?.mongoQueryRunner || manager?.queryRunner;
            }
            return this.defaultQueryRunner;
        },
        set(queryRunner: QueryRunner | undefined) {
            this.defaultQueryRunner = queryRunner;
        }
    });
}

patchManager(Repository.prototype);
patchManager(MongoRepository.prototype);
patchManager(BaseQueryRunner.prototype);
patchManager(DataSource.prototype);
patchQueryRunner(SelectQueryBuilder.prototype);

// Patch the query method of DataSource to use the current manager if in a transaction
// This allows the use of the query method with the current transaction context
// This is useful for executing raw SQL queries within a transaction context
const rawQueryFn = DataSource.prototype.query;
if (rawQueryFn.length < 3) {
    throw new Error('Version of TypeORM is not supported for patching the query method.');
}
DataSource.prototype.query = function <T = any>(
    this: DataSource,
    query: string,
    parameters?: any[] | ObjectLiteral,
    queryRunner?: QueryRunner
): Promise<T> {
    if (isInTransaction()) {
        queryRunner = queryRunner || this.manager?.queryRunner;
    }
    return rawQueryFn.call(this, query, parameters, queryRunner) as Promise<T>;
};

const rawDataSourceCreateQueryRunner = DataSource.prototype.createQueryRunner;

DataSource.prototype.createQueryRunner = function (mode: ReplicationMode = 'master'): QueryRunner {
    if (isInTransaction()) {
        return rawDataSourceCreateQueryRunner.apply(this, [mode]);
    }

    const customMode = getCustomReplicationMode();
    if (customMode) {
        return rawDataSourceCreateQueryRunner.apply(this, [customMode]);
    }
    return rawDataSourceCreateQueryRunner.apply(this, [mode]);
};

// Patch the release method of PostgresQueryRunner to log when it is called
// This is useful for debugging purposes to see when the query runner is released
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function patchReleaseDebug() {
    const rawQueryRunnerRelease = PostgresQueryRunner.prototype.release;

    PostgresQueryRunner.prototype.release = async function () {
        console.log('Release query runner in Postgres');
        return rawQueryRunnerRelease.call(this);
    };
}
