import { Component } from "react";
import { debounce, DebouncedFunc } from "lodash";
import { action, flow, makeObservable, observable } from "mobx";
import { bound } from "decorators/Bound";
import { Log } from "utils/functions/logger";
import { fetchData } from "utils/functions/setupGlobalFetch";

interface FetchStoreInit<T> extends RequestInit {
    errorMessage?: string;
    onLoading?: () => void;
    onSuccess?: (data?: T) => void;
    onError?: (err: Error) => void;
}

interface FetchStoreConfig {
    /** By default it is set to 25ms */
    delay?: number;
    /** If you want to make fetch by default */
    loadingByDefault?: boolean;
    /** Cross loading using localStorage unique key boolean toggling */
    crossLoad?: {
        /** Key for localeStorage, where true|false values will be set, which will trigger cross loading across all tabs */
        key: string;
        onCrossLoad: () => void;
    };
    removeLogger?: boolean;
}

const CROSS_LOAD_ERROR: string =
    "You didn't enable cross loading, add key to crossLoad property in init of FetchStore.fetch method!";

class FetchStore<T> {
    delay: number;
    ctx: Component | null;
    fetch: DebouncedFunc<(url: string | URL, init?: FetchStoreInit<T>) => void>;
    crossLoadKey?: string;
    removeLogger?: boolean;
    onCrossLoad?: () => void;

    @observable loading: boolean = false;
    @observable loaded: boolean = false;
    @observable idle: boolean = true;
    @observable data: T | null = null;
    @observable error: boolean = false;
    @observable errorMessage: string = "";
    @observable controller: AbortController | null = null;

    constructor(ctx: Component | null, init?: FetchStoreConfig) {
        this.ctx = ctx;
        this.delay = init?.delay ?? 25;
        this.controller = new AbortController();
        this.removeLogger = init?.removeLogger;

        if (init?.loadingByDefault) {
            this.loading = init?.loadingByDefault;
            this.idle = !init?.loadingByDefault;
        }

        this.fetch = debounce((url: string | URL, init?: FetchStoreInit<T>) => {
            this.cancelFetch();
            this._fetch(url, init);
        }, this.delay);

        if (init?.crossLoad) {
            const { key, onCrossLoad } = init.crossLoad;
            this.crossLoadKey = key;
            this.onCrossLoad = onCrossLoad.bind(this);

            window.addEventListener("storage", (evt) => {
                const canBeUpdated: boolean = evt.key === key && evt.oldValue !== evt.newValue;
                if (canBeUpdated) {
                    this.onCrossLoad?.();
                }
            });
        }

        makeObservable(this);

        if (!this.ctx) return;

        const _componentWillUnmount = this.ctx.componentWillUnmount?.bind(this.ctx);
        this.ctx.componentWillUnmount = () => {
            _componentWillUnmount?.();
            this.cancelFetch();
        };
    }

    @bound
    triggerCrossLoad(): void {
        if (!this.crossLoadKey) {
            Log.MobXError(CROSS_LOAD_ERROR);
            return;
        }

        const currValue: string | null = localStorage.getItem(this.crossLoadKey);
        if (!currValue) {
            localStorage.setItem(this.crossLoadKey, "true");
            return;
        }

        const newValue: string = currValue === "true" ? "false" : "true";
        localStorage.setItem(this.crossLoadKey, newValue);
    }

    @action.bound
    cancelFetch(): void {
        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }
    }

    @action.bound
    setLoading(): void {
        this.loading = true;
        this.loaded = false;
        this.idle = false;
        if (this.error) this.error = false;
    }

    @action.bound
    setLoaded(data?: T): void {
        this.loaded = true;
        this.loading = false;
        this.idle = false;
        if (data) this.data = data;
    }

    @action.bound
    setError(errorMessage: string): void {
        this.error = true;
        this.loading = false;
        this.loaded = false;
        this.idle = false;
        this.errorMessage = errorMessage;
    }

    @action.bound
    setIdle(): void {
        this.idle = true;
        this.loading = false;
        this.loaded = false;
        this.error = false;
    }

    @flow.bound
    private *_fetch(url: string | URL, init?: FetchStoreInit<T>): Generator<Promise<any>, T | undefined> {
        this.controller = new AbortController();
        const request = new Request(url, {
            ...init,
            signal: this.controller.signal,
        });

        const requestUrl: string = request.url.toString();

        try {
            this.setLoading();
            init?.onLoading?.();

            const response: Response = yield fetchData(request);

            if (!response.ok) {
                throw new Error(init?.errorMessage ?? "Something went wrong, try again later!");
            }

            const data: T = yield response.json();
            this.setLoaded(data);
            init?.onSuccess?.(data);

            if (!this.removeLogger) {
                Log.API(`[${request.method}] Successfull request: ${requestUrl}`);
            }

            return data;
        } catch (err) {
            if (err.name !== "AbortError") {
                this.setError(err.message);

                if (!this.removeLogger) {
                    Log.APIError(`[${request.method}] Failed request: ${requestUrl}`);
                }
            } else {
                this.setIdle();
            }

            init?.onError?.(err);
        } finally {
            this.controller = null;
        }
    }
}

export default FetchStore;
