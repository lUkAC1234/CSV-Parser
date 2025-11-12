type Importer = () => Promise<{ default: any }>;
type OnLoaded = (mod: any) => void;
type OnRequest = () => void;

interface Item {
    id: number;
    el: HTMLElement;
    offset: number;
    importer: Importer;
    onRequest?: OnRequest;
    onLoaded: OnLoaded;
    requested: boolean;
    failedCount: number;
    addedAt: number;
}

const items = new Map<number, Item>();
let nextId = 1;

let activeLoads = 0;
let queue: Array<() => void> = [];
let maxConcurrent = 2;
let settleDelay = 120;

let idleHandle: number | null = null;
let idlePrefetchEnabled = true;
let idlePrefetchDelay = 1000;
let observer: IntersectionObserver | null = null;
let observerMaxOffset = 0;

let rafId: number | null = null;
let listeningForScroll = false;

const clamp = (n: number, a = 0) => Math.max(a, n);

function scheduleProcessQueue() {
    while (activeLoads < maxConcurrent && queue.length > 0) {
        const task = queue.shift()!;
        task();
    }
}

function enqueueImport(task: () => Promise<void>) {
    if (activeLoads < maxConcurrent) {
        activeLoads++;
        task().finally(() => {
            activeLoads = Math.max(0, activeLoads - 1);
            setTimeout(scheduleProcessQueue, settleDelay);
        });
    } else {
        queue.push(() => {
            activeLoads++;
            task().finally(() => {
                activeLoads = Math.max(0, activeLoads - 1);
                setTimeout(scheduleProcessQueue, settleDelay);
            });
        });
    }
}

function processIntersectionEntry(entry: IntersectionObserverEntry) {
    const el = entry.target as HTMLElement;
    for (const [, item] of items) {
        if (item.el === el && !item.requested) {
            if (entry.isIntersecting || entry.intersectionRatio > 0) {
                item.requested = true;
                if (item.onRequest)
                    try {
                        item.onRequest();
                    } catch (e) {}
                enqueueImport(async () => {
                    try {
                        const mod = await item.importer();
                        item.onLoaded(mod);
                    } catch (err) {
                        item.requested = false;
                        item.failedCount++;
                        console.warn("Lazy import failed, will allow retry:", err);
                    }
                });
            }
        }
    }
}

function ensureObserver() {
    if (observer) return;
    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(processIntersectionEntry);
        },
        { root: null, rootMargin: `${observerMaxOffset}px 0px ${observerMaxOffset}px 0px`, threshold: 0 },
    );
    for (const [, item] of items) {
        observer.observe(item.el);
    }
}

function updateObserverRootMargin() {
    if (!observer) return;
    observer.disconnect();
    observer = null;
    ensureObserver();
}

function startScrollFallback() {
    if (listeningForScroll) return;
    listeningForScroll = true;
    window.addEventListener("scroll", triggerTickFallback, { passive: true });
    window.addEventListener("resize", triggerTickFallback);
    triggerTickFallback();
}

function stopScrollFallback() {
    listeningForScroll = false;
    window.removeEventListener("scroll", triggerTickFallback);
    window.removeEventListener("resize", triggerTickFallback);
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

function triggerTickFallback() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(tickFallback);
}

function tickFallback() {
    rafId = null;
    if (items.size === 0) {
        stopScrollFallback();
        return;
    }
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const candidates: Item[] = [];
    for (const [, item] of items) {
        if (item.requested) continue;
        const rect = item.el.getBoundingClientRect();
        let distance: number;
        if (rect.top > vh) distance = rect.top - vh;
        else if (rect.bottom < 0) distance = -rect.bottom;
        else distance = 0;
        if (distance <= item.offset) candidates.push(item);
    }
    if (candidates.length === 0) return;
    candidates.sort((a, b) => {
        const ra = a.el.getBoundingClientRect();
        const rb = b.el.getBoundingClientRect();
        return (
            Math.max(0, ra.top - (window.innerHeight || document.documentElement.clientHeight)) -
            Math.max(0, rb.top - (window.innerHeight || document.documentElement.clientHeight))
        );
    });
    const slots = Math.max(1, maxConcurrent - activeLoads);
    for (let i = 0; i < Math.min(slots, candidates.length); i++) {
        const item = candidates[i];
        if (item.requested) continue;
        item.requested = true;
        if (item.onRequest)
            try {
                item.onRequest();
            } catch (e) {}
        enqueueImport(async () => {
            try {
                const mod = await item.importer();
                item.onLoaded(mod);
            } catch (err) {
                item.requested = false;
                item.failedCount++;
            }
        });
    }
}

function scheduleIdlePrefetch() {
    if (!idlePrefetchEnabled) return;
    if (idleHandle !== null) return;
    const cb = () => {
        idleHandle = null;
        if (items.size === 0) return;
        const list: Item[] = [];
        for (const [, item] of items) {
            if (item.requested) continue;
            list.push(item);
        }
        if (list.length === 0) return;
        list.sort((a, b) => {
            const ra = a.el.getBoundingClientRect();
            const rb = b.el.getBoundingClientRect();
            const da = Math.max(0, ra.top - (window.innerHeight || document.documentElement.clientHeight));
            const db = Math.max(0, rb.top - (window.innerHeight || document.documentElement.clientHeight));
            return da - db;
        });
        const slots = Math.max(1, maxConcurrent - activeLoads);
        let started = 0;
        for (let i = 0; i < list.length && started < slots; i++) {
            const it = list[i];
            if (it.requested) continue;
            it.requested = true;
            started++;
            if (it.onRequest)
                try {
                    it.onRequest();
                } catch (e) {}
            enqueueImport(async () => {
                try {
                    const mod = await it.importer();
                    it.onLoaded(mod);
                } catch (err) {
                    it.requested = false;
                    it.failedCount++;
                }
            });
        }
        if (Array.from(items.values()).some((i) => !i.requested)) {
            scheduleIdlePrefetchDeferred();
        }
    };

    const ric = (window as any).requestIdleCallback ?? ((fn: any) => setTimeout(fn, idlePrefetchDelay));
    idleHandle = (ric as any)(cb);
}

function scheduleIdlePrefetchDeferred() {
    setTimeout(() => scheduleIdlePrefetch(), idlePrefetchDelay);
}

export default {
    register(el: HTMLElement, offset: number, importer: Importer, onLoaded: OnLoaded, onRequest?: OnRequest) {
        const id = nextId++;
        const item: Item = {
            id,
            el,
            offset: clamp(offset, 0),
            importer,
            onRequest,
            onLoaded,
            requested: false,
            failedCount: 0,
            addedAt: Date.now(),
        };
        items.set(id, item);

        observerMaxOffset = Math.max(observerMaxOffset, item.offset);
        if ((window as any).IntersectionObserver) {
            ensureObserver();
            observer!.observe(el);
        } else {
            startScrollFallback();
        }

        if ((window as any).IntersectionObserver) {
        } else {
            triggerTickFallback();
        }

        scheduleIdlePrefetchDeferred();
        return id;
    },

    unregister(id: number) {
        const item = items.get(id);
        if (!item) return;
        if (observer && item.el) {
            try {
                observer.unobserve(item.el);
            } catch (e) {}
        }
        items.delete(id);

        observerMaxOffset = 0;
        for (const [, it] of items) observerMaxOffset = Math.max(observerMaxOffset, it.offset);
        if (observer) updateObserverRootMargin();

        if (items.size === 0) {
            if (observer) {
                try {
                    observer.disconnect();
                } catch (e) {}
                observer = null;
            }
            stopScrollFallback();
            if (idleHandle !== null) {
                try {
                    (window as any).cancelIdleCallback?.(idleHandle);
                } catch (e) {}
                idleHandle = null;
            }
        }
    },

    setMaxConcurrent(n: number) {
        maxConcurrent = Math.max(1, Math.floor(n));
        scheduleProcessQueue();
    },

    setSettleDelay(ms: number) {
        settleDelay = Math.max(0, Math.floor(ms));
    },

    enableIdlePrefetch(enable: boolean) {
        idlePrefetchEnabled = !!enable;
        if (idlePrefetchEnabled) scheduleIdlePrefetch();
    },

    setIdlePrefetchDelay(ms: number) {
        idlePrefetchDelay = Math.max(0, Math.floor(ms));
    },

    // debug helpers
    _debug_getState() {
        return {
            activeLoads,
            queueLen: queue.length,
            items: Array.from(items.values()).map((i) => ({
                id: i.id,
                offset: i.offset,
                requested: i.requested,
                failed: i.failedCount,
            })),
            maxConcurrent,
            settleDelay,
        };
    },
};
