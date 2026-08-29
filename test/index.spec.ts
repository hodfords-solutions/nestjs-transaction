import { describe, expect, it } from 'vitest';
import * as publicApi from '../lib/index.js';

describe('public api', () => {
    it('re-exports the transaction helpers from the package root', () => {
        expect(typeof publicApi.runInTransaction).toBe('function');
        expect(typeof publicApi.isInTransaction).toBe('function');
    });

    it('reports being out of a transaction outside of any transactional context', () => {
        expect(publicApi.isInTransaction()).toBe(false);
    });
});
