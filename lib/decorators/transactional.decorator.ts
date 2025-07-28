import { RUNNING_IN_TRANSACTION_WATERMARK } from '../constants/cls-transaction.constant';
import { runInTransaction } from '../helpers/run-in-transaction.helper';
import { TransactionalOption } from '../types/transactional-option.type';

export function Transactional(option: TransactionalOption = {}): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            return runInTransaction(() => {
                return originalMethod.call(this, ...args);
            }, option);
        };
        Reflect.defineMetadata(RUNNING_IN_TRANSACTION_WATERMARK, true, descriptor.value);
        return descriptor;
    };
}
