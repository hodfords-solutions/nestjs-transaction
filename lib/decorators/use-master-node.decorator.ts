import { runInReplication } from '../helpers/run-in-replication.helper';
import { RUNNING_IN_TRANSACTION_WATERMARK } from '../constants/cls-transaction.constant';
import { cloneMethodAndMetadata } from '../helpers/metadata.helper';

export function UseMasterNode(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const newMethod = async function (...args: any[]) {
            if (
                Reflect.getMetadata(RUNNING_IN_TRANSACTION_WATERMARK, originalMethod) ||
                Reflect.getMetadata(RUNNING_IN_TRANSACTION_WATERMARK, descriptor.value)
            ) {
                return originalMethod.call(this, ...args);
            }
            return runInReplication('master', () => {
                return originalMethod.call(this, ...args);
            });
        };
        cloneMethodAndMetadata(originalMethod, newMethod);
        descriptor.value = newMethod;

        return descriptor;
    };
}
