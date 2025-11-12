import { action, makeObservable, observable, ObservableMap } from "mobx";
import { bound } from "decorators/Bound";
import MobxStore from "./Abstracts";
import RootStore from "./RootStore";

export const ORIGIN = import.meta.env.VITE_API_ORIGIN;

export type ApiMap = "/name";

class ApiStore extends MobxStore {
    origin: string = ORIGIN;
    @observable api_map: ObservableMap<ApiMap, string> = observable.map([
        ["/name", "/name/"],
    ]);

    constructor(rootStore: RootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @bound
    get(endpoint: ApiMap, id?: number | string): string | null {
        let url = this.api_map.get(endpoint);
        if (url) {
            const api: string = `${ORIGIN}/api`;
            url = `${api}${url}${id ? id : ""}`;
        }

        return url ?? null;
    }

    @action.bound
    setApiMap(apiMap: ObservableMap<ApiMap, string>) {
        this.api_map = apiMap;
    }
}

export default ApiStore;
