import { CLS_DB_REPLICATION_MODE_KEY, CLS_DB_REPLICATION_NAMESPACE } from '../constants/cls-replication.constant.js';
import { ReplicationMode } from 'typeorm';

export function markInCustomReplication(mode: ReplicationMode): void {
    CLS_DB_REPLICATION_NAMESPACE.set(CLS_DB_REPLICATION_MODE_KEY, mode);
}

export function isInCustomReplication() {
    return Boolean(getCustomReplicationMode());
}

export function getCustomReplicationMode(): ReplicationMode {
    return CLS_DB_REPLICATION_NAMESPACE.get(CLS_DB_REPLICATION_MODE_KEY);
}
