import styles from "./SmoothResizable.module.scss";
import { debounce } from "lodash";
import { createRef, PropsWithChildren, PureComponent, ReactNode, RefObject } from "react";

interface Props extends PropsWithChildren {
    transitionDurationMS?: number;
    minHeight?: number | string;
    maxHeight?: number | string;
}

class SmoothResizable extends PureComponent<Props> {
    mainRef: RefObject<HTMLDivElement> = createRef();
    wrapperRef: RefObject<HTMLDivElement> = createRef();
    resizeObserver: ResizeObserver;

    get transitionDuration(): number {
        return this.props.transitionDurationMS ?? 300;
    }

    get transition(): string {
        return `height ${this.transitionDuration}ms, width ${this.transitionDuration}ms`;
    }

    setupResizeObserver = debounce(() => {
        this.resizeObserver = new ResizeObserver(this.resizeObserverCallback);
        if (this.wrapperRef.current instanceof Element) {
            this.resizeObserver.observe(this.wrapperRef.current);
        }
    }, 50);

    destroyResizeObserver(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

    resizeObserverCallback = (): void => {
        const maxHeight: string = `${this.wrapperRef.current?.offsetHeight}px`;
        this.mainRef.current.style.height = maxHeight;
        this.mainRef.current.classList.add(styles["main--resizing"]);
        this.debouncedRemoveResizingClass();
    };

    debouncedRemoveResizingClass = debounce(() => {
        this.mainRef.current.classList.remove(styles["main--resizing"]);
    }, this.props.transitionDurationMS ?? 300);

    componentDidMount(): void {
        this.setupResizeObserver();
    }

    componentWillUnmount(): void {
        this.destroyResizeObserver();
        this.debouncedRemoveResizingClass.cancel();
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.children !== this.props.children) {
            this.resizeObserverCallback();
        }
    }

    render(): ReactNode {
        return (
            <div
                className={styles["main"]}
                ref={this.mainRef}
                style={{
                    transition: this.transition,
                    minHeight: this.props.minHeight,
                    maxHeight: this.props.maxHeight,
                }}
            >
                <div className={styles["wrapper"]} ref={this.wrapperRef}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default SmoothResizable;
