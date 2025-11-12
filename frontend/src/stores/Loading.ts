import { action, makeObservable, observable } from "mobx";
import RootStore from "./RootStore";
import MobxStore from "./Abstracts";

class LoadingStore extends MobxStore {
    loadingValue: number = 70;
    loadedValue: number = 100;

    @observable loading: boolean = false;
    @observable loaded: boolean = false;

    constructor(rootStore: RootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @action.bound
    setLoading(v: boolean): void {
        this.loading = v;
    }

    @action.bound
    setLoaded(v: boolean): void {
        this.loaded = v;
    }
}

export default LoadingStore;
