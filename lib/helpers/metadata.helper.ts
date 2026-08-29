export function cloneMetadata<T extends object>(source: T, target: T): void {
    const metadataKeys = Reflect.getMetadataKeys(source);
    for (const key of metadataKeys) {
        const metadataValue = Reflect.getMetadata(key, source);
        Reflect.defineMetadata(key, metadataValue, target);
    }
}

export function cloneMethodAndMoveMetadata(source: any, target: any): void {
    Object.defineProperty(target, 'name', { value: source.name });
    moveMetadata(source, target);
}

export function moveMetadata(source: any, target: any): void {
    const metadataKeys = Reflect.getMetadataKeys(source);
    for (const key of metadataKeys) {
        const metadataValue = Reflect.getMetadata(key, source);
        Reflect.defineMetadata(key, metadataValue, target);
        Reflect.deleteMetadata(key, source);
    }
}
