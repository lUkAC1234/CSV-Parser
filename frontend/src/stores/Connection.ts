import { action, makeObservable, observable } from "mobx";
import { bound } from "decorators/Bound";
import { IInitializable } from "types/mobx";
import RootStore from "./RootStore";
import MobxStore from "./Abstracts";

class ConnectionStore extends MobxStore implements IInitializable {
    @observable isOnline: boolean = navigator.onLine;

    constructor(rootStore: RootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @bound
    init(): void {
        window.addEventListener("online", this.setOnline);
        window.addEventListener("offline", this.setOffline);
    }

    @action.bound
    setConnection(isOnline: boolean): void {
        this.isOnline = isOnline;
    }

    @bound
    setOnline(): void {
        this.setConnection(true);
    }

    @bound
    setOffline(): void {
        this.setConnection(false);
    }
}

export default ConnectionStore;
