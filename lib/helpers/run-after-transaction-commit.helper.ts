import { addTransactionCommitHook, isInTransaction } from '../helpers/cls-db-transaction.helper';

export function runAfterTransactionCommit(fn: () => any) {
    if (isInTransaction()) {
        return addTransactionCommitHook(() => fn());
    } else {
        return fn();
    }
}
