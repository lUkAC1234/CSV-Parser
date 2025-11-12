import { action, computed, makeObservable, observable } from "mobx";
import { IInitializable } from "types/mobx";
import { bound } from "decorators/Bound";
import { indexOfLangPath } from "./Locale";
import { withoutLangPathname } from "utils/functions/withoutLangPathname";
import { RouteProps } from "react-router-dom";
import { ROUTES } from "../Routes";
import RootStore from "./RootStore";
import MobxStore from "./Abstracts";

class RouterStore extends MobxStore implements IInitializable {
    routes: RouteProps[] = ROUTES;
    @observable pathname: string = location.pathname;
    @observable hash: string = location.hash;

    constructor(rootStore: RootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @bound
    init(): void {
        window.addEventListener("route-change", this.onRouteChange);
        window.addEventListener("hashchange", this.onHashChange);
    }

    @computed
    get splittedPathname(): string[] {
        return this.pathname.split("/");
    }

    @computed
    get langPath(): string {
        const langPathIndex: number = indexOfLangPath();
        if (langPathIndex === -1) return;
        return this.splittedPathname[langPathIndex];
    }

    @computed
    get withoutLangPathname(): string {
        return withoutLangPathname();
    }

    @computed
    get isHttp(): boolean {
        return location.protocol === "http:";
    }

    @computed
    get isHttps(): boolean {
        return location.protocol === "https:";
    }

    @computed
    get isHomePage(): boolean {
        const lang = this.rootStore.localeStore.lang ?? "";
        const normalizedPath = "/" + this.pathname.split("/").filter(Boolean).join("/");
        return normalizedPath === "/" || normalizedPath === `/${lang}`;
    }

    @action.bound
    setPathname(v: string): void {
        this.pathname = v;
    }

    @action.bound
    setHash(v: string): void {
        this.hash = v;
    }

    @bound
    private onRouteChange(): void {
        this.setPathname(location.pathname);
        document.startViewTransition();
    }

    @bound
    private onHashChange(): void {
        this.setHash(location.hash);
    }
}

export default RouterStore;
