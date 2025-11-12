import RootStore from "./RootStore";

const globalKey = "__rootStore";
const globalObj = window as any;

const store: RootStore = import.meta.hot ? (globalObj[globalKey] ||= new RootStore()) : new RootStore();

if (import.meta.env.DEV) {
    (window as any).__rootStore = store;
}

export default store;
