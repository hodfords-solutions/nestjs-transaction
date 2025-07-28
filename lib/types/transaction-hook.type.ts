export type TransactionHook = {
    fn: () => Promise<void>;
    executed: boolean;
};
