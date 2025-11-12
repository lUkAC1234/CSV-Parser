import styles from "./SpinnerLoader.module.scss";
import { CSSProperties, PureComponent, ReactNode } from "react";

interface Props {
    fullsizeCentered?: boolean;
    centerFixed?: boolean;
    style?: CSSProperties;
}

class SpinnerLoader extends PureComponent<Props> {
    render(): ReactNode {
        const { fullsizeCentered, centerFixed, style } = this.props;
        const wrapperClass = fullsizeCentered
            ? styles["spinner-loader__fullsize-centered-wrapper"]
            : centerFixed
              ? styles["spinner-loader__center-fixed-wrapper"]
              : "";

        const loader = <div className={styles["spinner-loader"]} />;

        return wrapperClass ? (
            <div className={`${wrapperClass} ${styles["spinner-loader-wrapper-for-all"]}`} style={style}>
                {loader}
            </div>
        ) : (
            loader
        );
    }
}

export default SpinnerLoader;
