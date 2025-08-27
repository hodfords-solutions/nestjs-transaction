import { ClsServiceManager } from 'nestjs-cls';

export const CLS_DB_TRANSACTION_NAMESPACE = ClsServiceManager.getClsService();

export const CLS_DB_IS_IN_TRANSACTION_KEY = 'is-in-transaction';
export const CLS_DB_TRANSACTION_MANAGER_KEY = 'manager-transaction';
export const CLS_DB_TRANSACTION_COMMIT_HOOK_KEY = 'transaction-commit-hook';

export const RUNNING_IN_TRANSACTION_WATERMARK = 'running-in-transaction';
