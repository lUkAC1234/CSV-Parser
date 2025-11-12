import { mobx } from "decorators/MobxStore";
import { Component, ReactNode } from "react";
import styles from "./LoadingLine.module.scss";

@mobx
class LoadingLine extends Component {
    get progress(): number {
        const { loading, loadingValue, loadedValue } = this.store.loadingStore;
        return loading ? loadingValue : loadedValue;
    }

    render(): ReactNode {
        const { loading } = this.store.loadingStore;
        return (
            <progress
                className={loading ? `${styles["progress"]} ${styles["progress--active"]}` : styles["progress"]}
                value={this.progress}
                max={100}
            />
        );
    }
}

export default LoadingLine;
