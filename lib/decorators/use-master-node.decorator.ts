import { runInReplication } from '../helpers/run-in-replication.helper.js';
import { RUNNING_IN_TRANSACTION_WATERMARK } from '../constants/cls-transaction.constant.js';
import { cloneMethodAndMoveMetadata } from '../helpers/metadata.helper.js';

export function UseMasterNode(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const newMethod = async function (...args: any[]) {
            if (Reflect.getMetadata(RUNNING_IN_TRANSACTION_WATERMARK, descriptor.value)) {
                return originalMethod.call(this, ...args);
            }
            return runInReplication('master', () => {
                return originalMethod.call(this, ...args);
            });
        };
        cloneMethodAndMoveMetadata(originalMethod, newMethod);
        descriptor.value = newMethod;

        return descriptor;
    };
}
