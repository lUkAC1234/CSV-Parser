import { setupGlobalFetch } from "utils/functions/setupGlobalFetch";
import ConnectionStore from "./Connection";
import LoadingStore from "./Loading";
import LocaleStore from "./Locale";
import RouterStore from "./Router";
import WindowStore from "./Window";
import FancyboxStore from "./Fancybox";
import ApiStore from "./Api";
import NavigationStore from "./Navigation";

class RootStore {
    localeStore: LocaleStore;
    connectionStore: ConnectionStore;
    routerStore: RouterStore;
    windowStore: WindowStore;
    loadingStore: LoadingStore;
    fancyboxStore: FancyboxStore;
    apiStore: ApiStore;
    navigationStore: NavigationStore;

    constructor() {
        this.localeStore = new LocaleStore(this);
        this.routerStore = new RouterStore(this);
        this.apiStore = new ApiStore(this);
        this.connectionStore = new ConnectionStore(this);
        this.windowStore = new WindowStore(this);
        this.loadingStore = new LoadingStore(this);
        this.fancyboxStore = new FancyboxStore(this);
        this.navigationStore = new NavigationStore(this);

        for (const [, store] of Object.entries(this)) {
            if (store !== undefined && "init" in store && typeof store.init === "function") {
                store.init();
            }
        }

        setupGlobalFetch(this);
    }
}

export default RootStore;
