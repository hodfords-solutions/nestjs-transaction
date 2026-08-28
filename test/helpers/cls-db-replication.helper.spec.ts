import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
    getCustomReplicationMode,
    isInCustomReplication,
    markInCustomReplication
} from '../../lib/helpers/cls-db-replication.helper.js';
import { CLS_DB_REPLICATION_NAMESPACE } from '../../lib/constants/cls-replication.constant.js';

const runInContext = <T>(fn: () => T): Promise<T> => CLS_DB_REPLICATION_NAMESPACE.run(async () => fn());

describe('cls-db-replication.helper', () => {
    it('reports no custom replication when nothing has been marked', async () => {
        await runInContext(() => {
            expect(getCustomReplicationMode()).toBeUndefined();
            expect(isInCustomReplication()).toBe(false);
        });
    });

    it('marks and retrieves the master replication mode', async () => {
        await runInContext(() => {
            markInCustomReplication('master');
            expect(getCustomReplicationMode()).toBe('master');
            expect(isInCustomReplication()).toBe(true);
        });
    });

    it('marks and retrieves the slave replication mode', async () => {
        await runInContext(() => {
            markInCustomReplication('slave');
            expect(getCustomReplicationMode()).toBe('slave');
            expect(isInCustomReplication()).toBe(true);
        });
    });

    it('isolates replication state between contexts', async () => {
        await runInContext(() => markInCustomReplication('slave'));
        await runInContext(() => {
            expect(isInCustomReplication()).toBe(false);
        });
    });
});
