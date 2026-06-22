import 'reflect-metadata';

const runInReplicationMock = jest.fn((_mode: any, fn: any) => fn());
jest.mock('../../lib/helpers/run-in-replication.helper', () => ({
    runInReplication: (mode: any, fn: any) => runInReplicationMock(mode, fn)
}));

import { UseMasterNode } from '../../lib/decorators/use-master-node.decorator';
import { RUNNING_IN_TRANSACTION_WATERMARK } from '../../lib/constants/cls-transaction.constant';

beforeEach(() => runInReplicationMock.mockClear());

describe('@UseMasterNode', () => {
    it('runs the method inside replication with the master mode', async () => {
        class Service {
            @UseMasterNode()
            async read(value: string) {
                return `read:${value}`;
            }
        }

        const result = await new Service().read('x');

        expect(result).toBe('read:x');
        expect(runInReplicationMock).toHaveBeenCalledTimes(1);
        expect(runInReplicationMock).toHaveBeenCalledWith('master', expect.any(Function));
    });

    it('preserves "this" binding and arguments', async () => {
        class Service {
            prefix = 'pre';

            @UseMasterNode()
            async build(suffix: string) {
                return `${this.prefix}-${suffix}`;
            }
        }

        await expect(new Service().build('post')).resolves.toBe('pre-post');
    });

    it('bypasses replication and calls the original directly when already in a transaction', async () => {
        class Service {
            async read() {
                return 'direct';
            }
        }

        // Tag the underlying method with the transaction watermark before decorating.
        Reflect.defineMetadata(RUNNING_IN_TRANSACTION_WATERMARK, true, Service.prototype.read);

        const descriptor = Object.getOwnPropertyDescriptor(Service.prototype, 'read')!;
        UseMasterNode()(Service.prototype, 'read', descriptor);
        Object.defineProperty(Service.prototype, 'read', descriptor);

        const result = await new Service().read();

        expect(result).toBe('direct');
        expect(runInReplicationMock).not.toHaveBeenCalled();
    });

    it('keeps the original method name', () => {
        class Service {
            @UseMasterNode()
            async fetchData() {
                return 1;
            }
        }

        expect(Service.prototype.fetchData.name).toBe('fetchData');
    });
});
