import { AsyncLocalStorage } from 'async_hooks';
import { ClsService } from 'nestjs-cls';

export const CLS_DB_REPLICATION_NAMESPACE_NAME = 'db-replication';
export const CLS_DB_REPLICATION_NAMESPACE = new ClsService(new AsyncLocalStorage());

export const CLS_DB_REPLICATION_MODE_KEY = 'replication-mode';

export const RUNNING_IN_REPLICATION_MODE_WATERMARK = 'running-in-replication-mode';
