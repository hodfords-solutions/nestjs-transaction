import { RUNNING_IN_TRANSACTION_WATERMARK } from '../constants/cls-transaction.constant.js';
import { runInTransaction } from '../helpers/run-in-transaction.helper.js';
import { TransactionalOption } from '../types/transactional-option.type.js';
import { cloneMethodAndMoveMetadata } from '../helpers/metadata.helper.js';

export function Transactional(option: TransactionalOption = {}): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const newMethod = async function (...args: any[]) {
            return runInTransaction(() => {
                return originalMethod.call(this, ...args);
            }, option);
        };
        cloneMethodAndMoveMetadata(originalMethod, newMethod);
        descriptor.value = newMethod;
        Reflect.defineMetadata(RUNNING_IN_TRANSACTION_WATERMARK, true, descriptor.value);
        return descriptor;
    };
}
