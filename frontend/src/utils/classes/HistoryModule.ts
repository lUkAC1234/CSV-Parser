import { bound } from "decorators/Bound";
import { ReactAppPlugin } from "./ReactPlugin";

export class HistoryModule {
    private originalPushState = history.pushState;
    private originalReplaceState = history.replaceState;
    private originalGo = history.go;
    private isScheduled: boolean = false;

    constructor() {
        history.pushState = this.pushState;
        history.replaceState = this.replaceState;
        history.go = this.go;
        window.addEventListener("popstate", this.popstateHandler);
    }

    private willUrlChange(url?: string | URL | null): boolean {
        if (url === undefined || url === null) {
            return false;
        }

        try {
            const newUrl = typeof url === "string" ? new URL(url, location.href) : new URL(String(url), location.href);
            return newUrl.href !== location.href;
        } catch (e) {
            console.error("HistoryModule: Invalid URL provided:", url, e);
            return false;
        }
    }

    @bound
    pushState(data: any, unused: string, url?: string | URL | null): void {
        const willChange = this.willUrlChange(url);
        if (willChange) {
            this.originalPushState.call(history, data, unused, url);
            this.dispatchRouteChange();
        }
    }

    @bound
    replaceState(data: any, unused: string, url?: string | URL | null): void {
        const willChange = this.willUrlChange(url);
        if (willChange) {
            this.originalReplaceState.call(history, data, unused, url);
            this.dispatchRouteChange();
        }
    }

    @bound
    go(delta?: number): void {
        this.originalGo.call(history, delta);
        this.dispatchRouteChange();
    }

    @bound
    popstateHandler(): void {
        this.dispatchRouteChange();
    }

    dispatchRouteChange(): void {
        if (!this.isScheduled) {
            this.isScheduled = true;

            queueMicrotask(() => {
                const event = new CustomEvent("route-change", {
                    detail: window.location,
                });
                window.dispatchEvent(event);

                this.isScheduled = false;
            });
        }
    }
}

export class HistoryModulePlugin extends ReactAppPlugin {
    setup(): void {
        new HistoryModule();
    }
}
