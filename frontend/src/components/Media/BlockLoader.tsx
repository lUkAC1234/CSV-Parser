import styles from "./BlockLoader.module.scss";
import { PureComponent, ReactNode, CSSProperties } from "react";

export interface BlockLoaderProps {
    isLoaded: boolean;
    loadingMessage?: ReactNode;
    children?: ReactNode;
    containerStyle?: CSSProperties;
    className?: string;
    underWrapperClassname?: string;
}

class BlockLoader extends PureComponent<BlockLoaderProps> {
    render() {
        const { isLoaded, loadingMessage, children, containerStyle, className, underWrapperClassname } = this.props;

        const underWrapperClass = [
            styles["under-wrapper"],
            underWrapperClassname ? styles[underWrapperClassname] || underWrapperClassname : "",
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <div style={containerStyle} className={className}>
                <div aria-hidden={!isLoaded} className={underWrapperClass}>
                    {children}
                </div>
                {!isLoaded && (
                    <div className={styles.loadingBanner} role="status" aria-live="polite">
                        <div className={styles.loadingContent}>{loadingMessage}</div>
                    </div>
                )}
            </div>
        );
    }
}

export default BlockLoader;
