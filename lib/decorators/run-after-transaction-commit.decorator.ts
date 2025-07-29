import { runAfterTransactionCommit } from '../helpers/run-after-transaction-commit.helper';
import { cloneMethodAndMoveMetadata } from '../helpers/metadata.helper';

export function RunAfterTransactionCommit(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const newMethod = async function (...args: any[]) {
            return runAfterTransactionCommit(() => originalMethod.call(this, ...args));
        };
        cloneMethodAndMoveMetadata(originalMethod, newMethod);
        descriptor.value = newMethod;
        return descriptor;
    };
}
