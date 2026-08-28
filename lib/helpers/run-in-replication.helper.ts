import { isInTransaction } from './cls-db-transaction.helper.js';
import { isInCustomReplication, markInCustomReplication } from './cls-db-replication.helper.js';
import { ReplicationMode } from 'typeorm';
import { CLS_DB_REPLICATION_NAMESPACE } from '../constants/cls-replication.constant.js';

export function runInReplication(mode: ReplicationMode, fn: any) {
    if (isInTransaction() || isInCustomReplication()) {
        return fn();
    }

    return CLS_DB_REPLICATION_NAMESPACE.run(() => {
        markInCustomReplication(mode);
        return fn();
    });
}
