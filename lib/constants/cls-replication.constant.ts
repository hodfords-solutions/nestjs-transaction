import cls from '@hodfords/cls-hooked';

export const CLS_DB_REPLICATION_NAMESPACE_NAME = 'db-replication';
export const CLS_DB_REPLICATION_NAMESPACE = cls.createNamespace(CLS_DB_REPLICATION_NAMESPACE_NAME);

export const CLS_DB_REPLICATION_MODE_KEY = 'replication-mode';

export const RUNNING_IN_REPLICATION_MODE_WATERMARK = 'running-in-replication-mode';
