import { isInTransaction } from './cls-db-transaction.helper';
import { isInCustomReplication, markInCustomReplication } from './cls-db-replication.helper';
import { ReplicationMode } from 'typeorm';
import { CLS_DB_REPLICATION_NAMESPACE } from '../constants/cls-replication.constant';

export function runInReplication(mode: ReplicationMode, fn: any) {
    if (isInTransaction() || isInCustomReplication()) {
        return fn();
    }

    return CLS_DB_REPLICATION_NAMESPACE.run(() => {
        markInCustomReplication(mode);
        return fn();
    });
}
