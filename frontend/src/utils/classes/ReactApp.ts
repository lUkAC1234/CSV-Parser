import { createElement, ReactNode, StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import { ReactAppPlugin } from "./ReactPlugin";
import { disableReactDevTools } from "utils/functions/disableReactDevTools";

const env = import.meta.env;

export class ReactApp {
    private plugins: Map<ReactAppPlugin, object> = new Map();
    private appNode: HTMLElement;
    private template: ReactNode;
    private root: Root;

    constructor(appNode: HTMLElement) {
        this.appNode = appNode;
        this.root = createRoot(this.appNode);
        this.checkReactDevTools();
    }

    private checkReactDevTools(): void {
        const allowReactDevTools: "true" | "false" = env.VITE_REACT_DEV_TOOLS;
        if (allowReactDevTools === "false") {
            disableReactDevTools();
        }
    }

    private initPlugins(): void {
        for (const [pluginInstance, options] of this.plugins) {
            pluginInstance.setup(options!);
        }
    }

    use<T extends object>(PluginClass: new () => ReactAppPlugin, options?: T): ReactApp {
        this.plugins.set(new PluginClass(), options!);
        return this;
    }

    render(template: ReactNode, strictMode?: boolean): void {
        this.initPlugins();

        this.template = strictMode ? createElement(StrictMode, {}, template) : template;

        this.root.render(this.template);
    }
}
