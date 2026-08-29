import {
    CLS_DB_IS_IN_TRANSACTION_KEY,
    CLS_DB_TRANSACTION_COMMIT_HOOK_KEY,
    CLS_DB_TRANSACTION_MANAGER_KEY,
    CLS_DB_TRANSACTION_NAMESPACE,
    CLS_DB_TRANSACTION_SESSION_KEY
} from '../constants/cls-transaction.constant.js';
import { TransactionHook } from '../types/transaction-hook.type.js';

export function markInTransaction(): void {
    CLS_DB_TRANSACTION_NAMESPACE.set(CLS_DB_IS_IN_TRANSACTION_KEY, true);
}

export function markOutOfTransaction(): void {
    CLS_DB_TRANSACTION_NAMESPACE.set(CLS_DB_IS_IN_TRANSACTION_KEY, false);
}

export function setCurrentTransactionManager(manager: any): void {
    CLS_DB_TRANSACTION_NAMESPACE.set(CLS_DB_TRANSACTION_MANAGER_KEY, manager);
}

export function setCurrentTransactionSession(session: any): void {
    CLS_DB_TRANSACTION_NAMESPACE.set(CLS_DB_TRANSACTION_SESSION_KEY, session);
}

export function isInTransaction(): boolean {
    return CLS_DB_TRANSACTION_NAMESPACE.get(CLS_DB_IS_IN_TRANSACTION_KEY) === true;
}

export function getCurrentTransactionManager() {
    return CLS_DB_TRANSACTION_NAMESPACE.get(CLS_DB_TRANSACTION_MANAGER_KEY);
}

export function getCurrentTransactionSession() {
    return CLS_DB_TRANSACTION_NAMESPACE.get(CLS_DB_TRANSACTION_SESSION_KEY);
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
