import { ComponentType, PureComponent, ReactNode, Suspense } from "react";
import styles from "./lazyLoaded.module.scss";
import SpinnerLoader from "components/Loaders/SpinnerLoader";

export function lazyLoaded(Component: ComponentType<unknown>) {
    return class LazyLoaded extends PureComponent {
        render(): ReactNode {
            return (
                <Suspense
                    fallback={
                        <div className={styles["loader-wrap"]}>
                            <SpinnerLoader fullsizeCentered />
                        </div>
                    }
                >
                    <Component />
                </Suspense>
            );
        }
    };
}
