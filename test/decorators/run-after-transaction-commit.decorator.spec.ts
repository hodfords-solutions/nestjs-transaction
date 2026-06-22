import 'reflect-metadata';

const runAfterTransactionCommitMock = jest.fn((fn: any) => fn());
jest.mock('../../lib/helpers/run-after-transaction-commit.helper', () => ({
    runAfterTransactionCommit: (fn: any) => runAfterTransactionCommitMock(fn)
}));

import { RunAfterTransactionCommit } from '../../lib/decorators/run-after-transaction-commit.decorator';

beforeEach(() => runAfterTransactionCommitMock.mockClear());

describe('@RunAfterTransactionCommit', () => {
    it('routes the method through runAfterTransactionCommit', async () => {
        class Service {
            @RunAfterTransactionCommit()
            async notify() {
                return 'sent';
            }
        }

        const result = await new Service().notify();

        expect(result).toBe('sent');
        expect(runAfterTransactionCommitMock).toHaveBeenCalledTimes(1);
        expect(runAfterTransactionCommitMock).toHaveBeenCalledWith(expect.any(Function));
    });

    it('preserves "this" binding and arguments', async () => {
        class Service {
            channel = 'email';

            @RunAfterTransactionCommit()
            async send(message: string) {
                return `${this.channel}:${message}`;
            }
        }

        await expect(new Service().send('hi')).resolves.toBe('email:hi');
    });

    it('keeps the original method name', () => {
        class Service {
            @RunAfterTransactionCommit()
            async dispatchEvent() {
                return 1;
            }
        }

        expect(Service.prototype.dispatchEvent.name).toBe('dispatchEvent');
    });
});
