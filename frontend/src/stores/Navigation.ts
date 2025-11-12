import { action, type IObservableArray, makeObservable, observable } from "mobx";
import { debounce } from "lodash";
import { ComponentType } from "react";
import RootStore from "./RootStore";
import MobxStore from "./Abstracts";
import HomeOutline from "components/SVG/Mobile/HomeOutline";
import HomeActive from "components/SVG/Mobile/HomeActive";

export type INavLink = {
    id: number;
    name: string;
    href: string;
    svgId: string;
};

class NavigationStore extends MobxStore {
    svgMap: Map<string, { outline: ComponentType<unknown>; active: ComponentType<unknown> }> = new Map([
        ["home", { outline: HomeOutline, active: HomeActive }],
    ]);

    @observable windowWidth: number = window.innerWidth;
    @observable links: IObservableArray<INavLink> = observable.array([
        { id: 1, name: "pages.home", href: "/", svgId: "home" },
    ]);

    constructor(rootStore: RootStore) {
        super(rootStore);
        window.addEventListener("resize", this.debouncedUpdateWindowWidth);
        makeObservable(this);
    }

    debouncedUpdateWindowWidth = debounce(() => {
        this.setWindowWidth(window.innerWidth);
    }, 150);

    @action.bound
    setWindowWidth(v: number): void {
        this.windowWidth = v;
    }

    @action.bound
    clearLinkList(): void {
        this.links.clear();
    }

    @action.bound
    addLink(name: string, href: string, svgId: string): void {
        const links = this.links;
        this.links.push({
            name,
            href,
            svgId,
            id: links.length > 1 ? links[links.length - 1].id : 1,
        });
    }

    @action.bound
    removeLink(href: string): void {
        for (let i = 0; i < this.links.length; ++i) {
            const link = this.links[i];
            if (link.href === href) {
                this.links.splice(i, 1);
                break;
            }
        }
    }
}

export default NavigationStore;
