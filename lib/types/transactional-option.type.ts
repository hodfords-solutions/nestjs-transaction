import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel.js';

export type TransactionalOption = {
    isolationLevel?: IsolationLevel;
};
