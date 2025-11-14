import { action, type IObservableArray, makeObservable, observable } from "mobx";
import { debounce } from "lodash";
import RootStore from "./RootStore";
import MobxStore from "./Abstracts";

export type INavLink = {
    id: number;
    name: string;
    href: string;
};

class NavigationStore extends MobxStore {
    @observable windowWidth: number = window.innerWidth;
    @observable links: IObservableArray<INavLink> = observable.array([
        { id: 1, name: "pages.home", href: "/" },
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
    addLink(name: string, href: string): void {
        const links = this.links;
        this.links.push({
            name,
            href,
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
