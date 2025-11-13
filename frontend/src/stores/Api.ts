import { action, makeObservable, observable, ObservableMap } from "mobx";
import { bound } from "decorators/Bound";
import MobxStore from "./Abstracts";
import RootStore from "./RootStore";

export const ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "";

export type ApiMap = "/users";

class ApiStore extends MobxStore {
    origin: string = ORIGIN;
    @observable api_map: ObservableMap<ApiMap, string> = observable.map([
        ["/users", "/users/"],
    ]);

    constructor(rootStore: RootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @bound
    get(endpoint: ApiMap, id?: number | string): string | null {
        const path = this.api_map.get(endpoint);
        if (!path) return null;
        const api = `${this.origin}/api`;
        return `${api}${path}${id ? id : ""}`;
    }

    @action.bound
    setApiMap(apiMap: ObservableMap<ApiMap, string>) {
        this.api_map = apiMap;
    }
}

export default ApiStore;
