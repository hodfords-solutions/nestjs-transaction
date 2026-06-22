import 'reflect-metadata';
import {
    addTransactionCommitHook,
    getCurrentTransactionManager,
    getCurrentTransactionSession,
    getTransactionCommitHooks,
    isInTransaction,
    markInTransaction,
    markOutOfTransaction,
    setCurrentTransactionManager,
    setCurrentTransactionSession
} from '../../lib/helpers/cls-db-transaction.helper';
import { CLS_DB_TRANSACTION_NAMESPACE } from '../../lib/constants/cls-transaction.constant';

const runInContext = <T>(fn: () => T): Promise<T> => CLS_DB_TRANSACTION_NAMESPACE.run(async () => fn());

// eslint-disable-next-line max-lines-per-function
describe('cls-db-transaction.helper', () => {
    describe('markInTransaction / markOutOfTransaction / isInTransaction', () => {
        it('returns undefined when no value has been set yet', () => {
            expect(isInTransaction()).toBeUndefined();
        });

        it('marks the context as in a transaction', async () => {
            await runInContext(() => {
                markInTransaction();
                expect(isInTransaction()).toBe(true);
            });
        });

        it('marks the context as out of a transaction', async () => {
            await runInContext(() => {
                markInTransaction();
                markOutOfTransaction();
                expect(isInTransaction()).toBe(false);
            });
        });

        it('isolates transaction state between separate contexts', async () => {
            await runInContext(() => markInTransaction());
            // A brand new context should not see the previous flag.
            await runInContext(() => {
                expect(isInTransaction()).toBeUndefined();
            });
        });
    });

    describe('transaction manager', () => {
        it('stores and retrieves the current manager', async () => {
            const manager = { id: 'manager' };
            await runInContext(() => {
                setCurrentTransactionManager(manager);
                expect(getCurrentTransactionManager()).toBe(manager);
            });
        });

        it('can clear the manager by setting null', async () => {
            await runInContext(() => {
                setCurrentTransactionManager({ id: 'manager' });
                setCurrentTransactionManager(null);
                expect(getCurrentTransactionManager()).toBeNull();
            });
        });
    });

    describe('transaction session', () => {
        it('stores and retrieves the current session', async () => {
            const session = { id: 'session' };
            await runInContext(() => {
                setCurrentTransactionSession(session);
                expect(getCurrentTransactionSession()).toBe(session);
            });
        });
    });

    describe('commit hooks', () => {
        it('returns an empty array when no hooks have been registered', async () => {
            await runInContext(() => {
                expect(getTransactionCommitHooks()).toEqual([]);
            });
        });

        it('adds a hook with executed set to false', async () => {
            const fn = jest.fn();
            await runInContext(() => {
                addTransactionCommitHook(fn);
                const hooks = getTransactionCommitHooks();
                expect(hooks).toHaveLength(1);
                expect(hooks[0].executed).toBe(false);
                expect(typeof hooks[0].fn).toBe('function');
            });
        });

        it('accumulates multiple hooks in registration order', async () => {
            const first = jest.fn();
            const second = jest.fn();
            await runInContext(() => {
                addTransactionCommitHook(first);
                addTransactionCommitHook(second);
                expect(getTransactionCommitHooks()).toHaveLength(2);
            });
        });

        it('wraps the registered function so invoking it calls the original', async () => {
            const fn = jest.fn().mockResolvedValue('done');
            await runInContext(async () => {
                addTransactionCommitHook(fn);
                const [hook] = getTransactionCommitHooks();
                await hook.fn();
                expect(fn).toHaveBeenCalledTimes(1);
            });
        });
    });
});
