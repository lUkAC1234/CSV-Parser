import RootStore from "./RootStore";

class MobxStore {
    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }
}

export default MobxStore;
