import {
    CLS_DB_IS_IN_TRANSACTION_KEY,
    CLS_DB_TRANSACTION_COMMIT_HOOK_KEY,
    CLS_DB_TRANSACTION_MANAGER_KEY,
    CLS_DB_TRANSACTION_NAMESPACE
} from '../constants/cls-transaction.constant';
import { TransactionHook } from '../types/transaction-hook.type';

export function markInTransaction(): void {
    CLS_DB_TRANSACTION_NAMESPACE.set(CLS_DB_IS_IN_TRANSACTION_KEY, true);
}

export function markOutOfTransaction(): void {
    CLS_DB_TRANSACTION_NAMESPACE.set(CLS_DB_IS_IN_TRANSACTION_KEY, false);
}

export function setCurrentTransactionManager(manager: any): void {
    CLS_DB_TRANSACTION_NAMESPACE.set(CLS_DB_TRANSACTION_MANAGER_KEY, manager);
}

export function isInTransaction() {
    return CLS_DB_TRANSACTION_NAMESPACE.get(CLS_DB_IS_IN_TRANSACTION_KEY);
}

export function getCurrentTransactionManager() {
    return CLS_DB_TRANSACTION_NAMESPACE.get(CLS_DB_TRANSACTION_MANAGER_KEY);
}

export function addTransactionCommitHook(fn: () => Promise<void>) {
    const hooks: TransactionHook[] = CLS_DB_TRANSACTION_NAMESPACE.get(CLS_DB_TRANSACTION_COMMIT_HOOK_KEY) || [];
    hooks.push({
        fn,
        executed: false
    });
    CLS_DB_TRANSACTION_NAMESPACE.set(CLS_DB_TRANSACTION_COMMIT_HOOK_KEY, hooks);
}

export function getTransactionCommitHooks(): TransactionHook[] {
    return CLS_DB_TRANSACTION_NAMESPACE.get(CLS_DB_TRANSACTION_COMMIT_HOOK_KEY) || [];
}
