import { PureComponent, ReactNode, createRef, ComponentType } from "react";
import lazyManager from "./utils/lazyManager";

type Importer = () => Promise<{ default: ComponentType<any> }>;

interface Props {
    importer: Importer;
    offsetPx?: number;
    className?: string;
    fallback?: ReactNode;
    once?: boolean;
    maxConcurrent?: number;
    prefetchOnMount?: boolean;
}

interface State {
    Component: ComponentType<any> | null;
    isLoading: boolean;
}

export default class LazySection extends PureComponent<Props, State> {
    static defaultProps = {
        offsetPx: 100,
        once: true,
        fallback: null,
        prefetchOnMount: false,
    };

    containerRef = createRef<HTMLDivElement>();
    _id: number | null = null;
    _isMounted = false;

    state: Readonly<State> = {
        Component: null,
        isLoading: true,
    };

    componentDidMount() {
        this._isMounted = true;

        if (typeof this.props.maxConcurrent === "number") {
            lazyManager.setMaxConcurrent(this.props.maxConcurrent);
        }

        const el = this.containerRef.current;
        if (!el) return;

        const offset = this.props.offsetPx ?? 100;

        this._id = lazyManager.register(
            el,
            offset,
            this.props.importer,
            (mod) => {
                if (!this._isMounted) return;
                const Comp = mod?.default ?? null;
                this.setState({ Component: Comp, isLoading: false }, () => {
                    if (this.props.once && this._id !== null) {
                        lazyManager.unregister(this._id);
                        this._id = null;
                    }
                });
            },
            () => {
                if (!this._isMounted) return;
                this.setState({ isLoading: true });
            },
        );

        if (this.props.prefetchOnMount) {
            lazyManager.enableIdlePrefetch(true);
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
        if (this._id !== null) {
            lazyManager.unregister(this._id);
            this._id = null;
        }
    }

    render() {
        const { fallback, className } = this.props;
        const { Component, isLoading } = this.state;

        return (
            <div ref={this.containerRef} className={className} aria-busy={isLoading && !Component} aria-live="polite">
                {Component ? <Component /> : isLoading ? fallback : fallback}
            </div>
        );
    }
}
