export function cloneMetadata<T>(source: T, target: T): void {
    const metadataKeys = Reflect.getMetadataKeys(source);
    for (const key of metadataKeys) {
        const metadataValue = Reflect.getMetadata(key, source);
        Reflect.defineMetadata(key, metadataValue, target);
    }
}

export function cloneMethodAndMetadata(source: any, target: any): void {
    Object.defineProperty(target, 'name', { value: source.name });
    cloneMetadata(source, target);
}
