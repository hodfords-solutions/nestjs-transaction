import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { runAfterTransactionCommit } from '../../lib/helpers/run-after-transaction-commit.helper.js';
import { CLS_DB_TRANSACTION_NAMESPACE } from '../../lib/constants/cls-transaction.constant.js';
import { getTransactionCommitHooks, markInTransaction } from '../../lib/helpers/cls-db-transaction.helper.js';

describe('runAfterTransactionCommit', () => {
    it('executes the function immediately when not in a transaction', async () => {
        const fn = vi.fn().mockReturnValue('result');

        const result = await CLS_DB_TRANSACTION_NAMESPACE.run(async () => runAfterTransactionCommit(fn));

        expect(fn).toHaveBeenCalledTimes(1);
        expect(result).toBe('result');
    });

    it('executes immediately when there is no CLS context at all', () => {
        const fn = vi.fn().mockReturnValue(42);

        const result = runAfterTransactionCommit(fn);

        expect(fn).toHaveBeenCalledTimes(1);
        expect(result).toBe(42);
    });

    it('defers the function as a commit hook when inside a transaction', async () => {
        const fn = vi.fn();

        await CLS_DB_TRANSACTION_NAMESPACE.run(async () => {
            markInTransaction();
            runAfterTransactionCommit(fn);

            // Should not have run yet - it is queued.
            expect(fn).not.toHaveBeenCalled();
            const hooks = getTransactionCommitHooks();
            expect(hooks).toHaveLength(1);

            await hooks[0].fn();
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });
});
