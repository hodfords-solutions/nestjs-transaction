import { runInReplication } from '../helpers/run-in-replication.helper';
import { RUNNING_IN_TRANSACTION_WATERMARK } from '../constants/cls-transaction.constant';

export function UseMasterNode(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            if (
                Reflect.getMetadata(RUNNING_IN_TRANSACTION_WATERMARK, originalMethod) ||
                Reflect.getMetadata(RUNNING_IN_TRANSACTION_WATERMARK, descriptor.value)
            ) {
                console.log('Running in transaction, skipping master node enforcement');
                return originalMethod.call(this, ...args);
            }
            return runInReplication('master', () => {
                return originalMethod.call(this, ...args);
            });
        };

        return descriptor;
    };
}
