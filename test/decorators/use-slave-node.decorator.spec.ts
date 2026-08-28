import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { runInReplicationMock } = vi.hoisted(() => ({ runInReplicationMock: vi.fn((mode: any, fn: any) => fn()) }));
vi.mock('../../lib/helpers/run-in-replication.helper.js', () => ({
    runInReplication: (mode: any, fn: any) => runInReplicationMock(mode, fn)
}));

import { UseSlaveNode } from '../../lib/decorators/use-slave-node.decorator.js';
import { RUNNING_IN_TRANSACTION_WATERMARK } from '../../lib/constants/cls-transaction.constant.js';
import { RUNNING_IN_REPLICATION_MODE_WATERMARK } from '../../lib/constants/cls-replication.constant.js';

beforeEach(() => {
    runInReplicationMock.mockClear();
});

// eslint-disable-next-line max-lines-per-function
describe('@UseSlaveNode', () => {
    it('runs the method inside replication with the slave mode', async () => {
        class Service {
            @UseSlaveNode()
            async read() {
                return 'value';
            }
        }

        const result = await new Service().read();

        expect(result).toBe('value');
        expect(runInReplicationMock).toHaveBeenCalledWith('slave', expect.any(Function));
    });

    it('marks the wrapped method with the replication-mode watermark', () => {
        class Service {
            @UseSlaveNode()
            async read() {
                return 1;
            }
        }

        expect(Reflect.getMetadata(RUNNING_IN_REPLICATION_MODE_WATERMARK, Service.prototype.read)).toBe(true);
    });

    it('bypasses replication and calls the original directly when already in a transaction', async () => {
        class Service {
            async read() {
                return 'direct';
            }
        }

        Reflect.defineMetadata(RUNNING_IN_TRANSACTION_WATERMARK, true, Service.prototype.read);
        const descriptor = Object.getOwnPropertyDescriptor(Service.prototype, 'read')!;
        UseSlaveNode()(Service.prototype, 'read', descriptor);
        Object.defineProperty(Service.prototype, 'read', descriptor);

        await expect(new Service().read()).resolves.toBe('direct');
        expect(runInReplicationMock).not.toHaveBeenCalled();
    });

    it('preserves "this" binding and arguments', async () => {
        class Service {
            base = 'b';

            @UseSlaveNode()
            async combine(extra: string) {
                return `${this.base}${extra}`;
            }
        }

        await expect(new Service().combine('x')).resolves.toBe('bx');
    });
});
