import RootStore from "stores/RootStore";

export type PropsWithClassName = { className?: string };

declare module "react" {
    interface Component {
        readonly store: RootStore;
        onStoreReady(): void;
    }
}
