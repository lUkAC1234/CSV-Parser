export function bound(_target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod: any = descriptor.value;
    return {
        configurable: true,
        get() {
            if (this === undefined) return originalMethod;
            const bound: any = originalMethod.bind(this);
            Object.defineProperty(this, key, {
                value: bound,
                configurable: true,
                writable: true,
            });
            return bound;
        },
    };
}

export function boundAll<T extends { new (...args: any[]): object }>(Target: T) {
    return class extends Target {
        constructor(...args: any[]) {
            super(...args);

            const proto: any = Object.getPrototypeOf(this);
            const propNames: (string | symbol)[] = [
                ...Object.getOwnPropertyNames(proto),
                ...(Object.getOwnPropertySymbols(proto) as (string | symbol)[]),
            ];

            for (const key of propNames) {
                const desc: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(proto, key);
                if (desc && typeof desc.value === "function" && key !== "constructor") {
                    this[key] = desc.value.bind(this);
                }
            }
        }
    };
}
