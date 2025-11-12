export type BeforeUnloadHandler = (evt: BeforeUnloadEvent) => void;

export class BeforeUnloadEntry {
    private static _collection: WeakSet<WeakKey> = new WeakSet();

    public static add(fn: (...args: unknown[]) => void): void {
        this._collection.add(fn);
    }

    public static get collection(): WeakSet<WeakKey> {
        return this._collection;
    }
}

export class BeforeUnload {
    public static addHandler(fn: BeforeUnloadHandler): typeof BeforeUnload | undefined {
        if (BeforeUnloadEntry.collection.has(fn)) {
            console.warn(
                "You're trying to add handler that is already been added to before unload event entry collection!",
            );
            return;
        }

        BeforeUnloadEntry.add(fn);
        this.hookEvent(fn);

        return this;
    }

    private static hookEvent(fn: BeforeUnloadHandler): void {
        window.addEventListener("beforeunload", fn);
    }
}
