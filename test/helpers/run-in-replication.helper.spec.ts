import 'reflect-metadata';
import { runInReplication } from '../../lib/helpers/run-in-replication.helper';
import { CLS_DB_TRANSACTION_NAMESPACE } from '../../lib/constants/cls-transaction.constant';
import { CLS_DB_REPLICATION_NAMESPACE } from '../../lib/constants/cls-replication.constant';
import { markInTransaction } from '../../lib/helpers/cls-db-transaction.helper';
import {
    getCustomReplicationMode,
    markInCustomReplication
} from '../../lib/helpers/cls-db-replication.helper';

describe('runInReplication', () => {
    it('opens a new replication context and marks the requested mode', async () => {
        let observedMode: string | undefined;
        const fn = jest.fn(() => {
            observedMode = getCustomReplicationMode();
            return 'value';
        });

        const result = await runInReplication('slave', fn);

        expect(result).toBe('value');
        expect(observedMode).toBe('slave');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('runs the function directly without re-marking when already in a transaction', async () => {
        const fn = jest.fn(() => getCustomReplicationMode());

        const result = await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
            markInTransaction();
            return runInReplication('master', fn);
        });

        // Because we short-circuit, no replication mode is ever set.
        expect(result).toBeUndefined();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not override the existing mode when already in custom replication', async () => {
        const fn = jest.fn(() => getCustomReplicationMode());

        const result = await CLS_DB_REPLICATION_NAMESPACE.run(async () => {
            markInCustomReplication('slave');
            // Asking for master should be ignored because we are already in replication.
            return runInReplication('master', fn);
        });

        expect(result).toBe('slave');
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
