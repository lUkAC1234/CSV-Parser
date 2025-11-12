import { action, makeObservable, observable } from "mobx";
import RootStore from "./RootStore";
import MobxStore from "./Abstracts";

class FancyboxStore extends MobxStore {
    @observable isActive: boolean = false;

    constructor(rootStore: RootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @action.bound
    setStatus(isActive: boolean): void {
        this.isActive = isActive;
    }
}

export default FancyboxStore;
