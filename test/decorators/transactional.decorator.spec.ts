import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { runInTransactionMock } = vi.hoisted(() => ({ runInTransactionMock: vi.fn((fn: any, option?: any) => fn()) }));
vi.mock('../../lib/helpers/run-in-transaction.helper.js', () => ({
    runInTransaction: (fn: any, option: any) => runInTransactionMock(fn, option)
}));

import { Transactional } from '../../lib/decorators/transactional.decorator.js';
import { RUNNING_IN_TRANSACTION_WATERMARK } from '../../lib/constants/cls-transaction.constant.js';

beforeEach(() => {
    runInTransactionMock.mockClear();
});

// eslint-disable-next-line max-lines-per-function
describe('@Transactional', () => {
    it('runs the original method through runInTransaction and preserves the return value', async () => {
        class Service {
            @Transactional()
            async doWork(a: number, b: number) {
                return a + b;
            }
        }

        const result = await new Service().doWork(2, 3);

        expect(result).toBe(5);
        expect(runInTransactionMock).toHaveBeenCalledTimes(1);
        expect(runInTransactionMock).toHaveBeenCalledWith(expect.any(Function), {});
    });

    it('forwards the provided option object to runInTransaction', async () => {
        class Service {
            @Transactional({ isolationLevel: 'SERIALIZABLE' })
            async doWork() {
                return 'done';
            }
        }

        await new Service().doWork();

        expect(runInTransactionMock).toHaveBeenCalledWith(expect.any(Function), {
            isolationLevel: 'SERIALIZABLE'
        });
    });

    it('preserves "this" binding and arguments', async () => {
        class Service {
            value = 10;

            @Transactional()
            async add(n: number) {
                return this.value + n;
            }
        }

        await expect(new Service().add(5)).resolves.toBe(15);
    });

    it('marks the wrapped method with the running-in-transaction watermark', () => {
        class Service {
            @Transactional()
            async doWork() {
                return 1;
            }
        }

        const watermark = Reflect.getMetadata(RUNNING_IN_TRANSACTION_WATERMARK, Service.prototype.doWork);
        expect(watermark).toBe(true);
    });

    it('keeps the original method name on the wrapper', () => {
        class Service {
            @Transactional()
            async namedMethod() {
                return 1;
            }
        }

        expect(Service.prototype.namedMethod.name).toBe('namedMethod');
    });
});
