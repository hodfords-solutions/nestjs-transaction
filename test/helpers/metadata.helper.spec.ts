import 'reflect-metadata';
import { cloneMetadata, cloneMethodAndMoveMetadata, moveMetadata } from '../../lib/helpers/metadata.helper';

// eslint-disable-next-line max-lines-per-function
describe('metadata.helper', () => {
    describe('cloneMetadata', () => {
        it('copies all metadata keys from source to target without removing them from source', () => {
            const source = {};
            const target = {};
            Reflect.defineMetadata('key-a', 'value-a', source);
            Reflect.defineMetadata('key-b', { nested: true }, source);

            cloneMetadata(source, target);

            expect(Reflect.getMetadata('key-a', target)).toBe('value-a');
            expect(Reflect.getMetadata('key-b', target)).toEqual({ nested: true });
            // Source keeps its metadata.
            expect(Reflect.getMetadata('key-a', source)).toBe('value-a');
        });

        it('does nothing when the source has no metadata', () => {
            const source = {};
            const target = {};

            expect(() => cloneMetadata(source, target)).not.toThrow();
            expect(Reflect.getMetadataKeys(target)).toHaveLength(0);
        });
    });

    describe('moveMetadata', () => {
        it('copies metadata to target and deletes it from source', () => {
            const source = {};
            const target = {};
            Reflect.defineMetadata('moved-key', 123, source);

            moveMetadata(source, target);

            expect(Reflect.getMetadata('moved-key', target)).toBe(123);
            expect(Reflect.hasMetadata('moved-key', source)).toBe(false);
        });
    });

    describe('cloneMethodAndMoveMetadata', () => {
        it('copies the function name and moves metadata from source to target', () => {
            function originalMethod() {
                return 'original';
            }
            Reflect.defineMetadata('custom', 'meta', originalMethod);

            const target = function () {
                return 'target';
            };

            cloneMethodAndMoveMetadata(originalMethod, target);

            expect(target.name).toBe('originalMethod');
            expect(Reflect.getMetadata('custom', target)).toBe('meta');
            expect(Reflect.hasMetadata('custom', originalMethod)).toBe(false);
        });
    });
});
