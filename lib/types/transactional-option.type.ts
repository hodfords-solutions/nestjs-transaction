import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

export type TransactionalOption = {
    isolationLevel?: IsolationLevel;
};
