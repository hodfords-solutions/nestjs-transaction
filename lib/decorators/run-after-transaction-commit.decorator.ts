import { runAfterTransactionCommit } from '../helpers/run-after-transaction-commit.helper';

export function RunAfterTransactionCommit(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            return runAfterTransactionCommit(() => originalMethod.call(this, ...args));
        };

        return descriptor;
    };
}
