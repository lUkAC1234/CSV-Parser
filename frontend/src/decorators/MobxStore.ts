import { Component } from "react";
import { observer } from "mobx-react";
import { setComponentName } from "utils/functions/setComponentName";
import RootStore from "stores/RootStore";
import store from "stores/index";

export function mobxStore<T extends { new (...args: any[]): Component }>(Target: T) {
    class MobxStore extends Target {
        store: RootStore;

        constructor(...args: any[]) {
            super(...args);
            this.store = store;
            if (this.onStoreReady && typeof this.onStoreReady === "function") {
                this.onStoreReady();
            }
        }
    }

    setComponentName(MobxStore, Target, "MobxStore");
    return MobxStore;
}

export function mobx<T extends { new (...args: any[]): Component }>(Target: T) {
    @mobxStore
    @observer
    class Mobx extends Target {}

    setComponentName(Mobx, Target, "MobX");
    return Mobx;
}
