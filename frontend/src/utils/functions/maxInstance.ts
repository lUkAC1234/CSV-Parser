export function maxInstance<T extends { new (...args: any[]) }>(maxInstanceNum: number, classModule: T): () => void {
    if (typeof classModule !== "function") {
        throw new Error("It is not class or function!");
    }

    Object.defineProperty(classModule, "instanceNum", {
        configurable: true,
        writable: true,
        value: 0,
    });

    return () => {
        if (classModule["instanceNum"] === maxInstanceNum) {
            throw new Error(`Cannot create more than ${maxInstanceNum} for ${classModule.name} class!`);
        }

        classModule["instanceNum"]++;
    };
}
