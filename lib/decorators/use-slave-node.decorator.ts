import { runInReplication } from '../helpers/run-in-replication.helper';
import { RUNNING_IN_REPLICATION_MODE_WATERMARK } from '../constants/cls-replication.constant';
import { RUNNING_IN_TRANSACTION_WATERMARK } from '../constants/cls-transaction.constant';
import { cloneMethodAndMoveMetadata } from '../helpers/metadata.helper';

export function UseSlaveNode(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const newMethod = async function (...args: any[]) {
            if (Reflect.getMetadata(RUNNING_IN_TRANSACTION_WATERMARK, descriptor.value)) {
                return originalMethod.call(this, ...args);
            }
            return runInReplication('slave', () => {
                return originalMethod.call(this, ...args);
            });
        };
        cloneMethodAndMoveMetadata(originalMethod, newMethod);
        descriptor.value = newMethod;
        Reflect.defineMetadata(RUNNING_IN_REPLICATION_MODE_WATERMARK, true, descriptor.value);
        return descriptor;
    };
}
