import { CSSProperties, PureComponent, ReactNode, VideoHTMLAttributes, createRef } from "react";
import BlockLoader, { BlockLoaderProps } from "./BlockLoader";
import styles from "./OptimizedMedia.module.scss";

export type VideoSource = { src: string; type?: string };

export interface OptimizedMediaProps extends Omit<BlockLoaderProps, "isLoaded"> {
    src: string;
    alt?: string;
    thumbnail?: string;
    fallbackSrc?: string;
    imageClassname?: string;
    aspect_16_9?: boolean;
    no_aspect?: boolean;
    no_image_height?: boolean;
    imagePropsStyle?: CSSProperties;
    srcSet?: string;
    sizes?: string | Record<string, string>;
    thumbnailSizes?: Record<string, string>;
    priority?: boolean;
    containerStyle?: CSSProperties;
    className?: string;
    loadingMessage?: any;
    underWrapperClassname?: string;
    crossfadeMs?: number;
    decodeTimeoutMs?: number;
    crossOrigin?: "" | "anonymous" | "use-credentials" | undefined;
    onLoadComplete?: (payload: { src: string; usedFallback?: boolean; timeMs?: number }) => void;
    type?: "image" | "video";
    videoProps?: VideoHTMLAttributes<HTMLVideoElement>;
    sources?: VideoSource[];
}

interface OptimizedMediaState {
    mainDecodedSrc: string | null;
    isInView: boolean;
    isThumbLoaded: boolean;
    triedFallback: boolean;
    decodeError?: Error | null;
}

type MediaListenerEntry = {
    media: string;
    url: string;
    mql: MediaQueryList;
    listener: (e: MediaQueryListEvent) => void;
};

export default class OptimizedMedia extends PureComponent<OptimizedMediaProps, OptimizedMediaState> {
    static decodedImageCache = new Map<string, true>();
    static readyVideoCache = new Map<string, true>();
    static objectUrlMap = new Map<string, string>();
    static loadPromises = new Map<string, Promise<void>>();
    static decodedImageUrls = new Set<string>();

    private static objectUrlOrder: string[] = [];
    private static createdObjectUrls = new Set<string>();
    private static OBJECT_URL_CACHE_LIMIT = 150;

    static defaultProps = { crossfadeMs: 120, decodeTimeoutMs: 15000, type: "image" as "image" | "video" };

    containerRef = createRef<HTMLDivElement>();
    mainImgRef = createRef<HTMLImageElement>();
    thumbImgRef = createRef<HTMLImageElement>();
    mainVideoRef = createRef<HTMLVideoElement>();
    observer: IntersectionObserver | null = null;
    _isMounted = false;
    _activeLoaderId = 0;
    _currentLoaderElement: HTMLImageElement | HTMLVideoElement | null = null;
    _idleHandle: number | null = null;
    mediaListeners: MediaListenerEntry[] = [];

    state: OptimizedMediaState = {
        mainDecodedSrc: null,
        isInView: false,
        isThumbLoaded: false,
        triedFallback: false,
        decodeError: null,
    };

    componentDidMount() {
        this._isMounted = true;
        if (this.props.priority) this.setState({ isInView: true }, () => this.startPreload());
        this.initObserver();
        this.scheduleIdlePreloadIfAppropriate();
        this.setupMediaListeners();
    }

    componentDidUpdate(prev: OptimizedMediaProps) {
        const sizesChanged =
            prev.src !== this.props.src ||
            prev.thumbnail !== this.props.thumbnail ||
            prev.type !== this.props.type ||
            JSON.stringify(prev.sizes) !== JSON.stringify(this.props.sizes) ||
            JSON.stringify((prev as any).thumbnailSizes) !== JSON.stringify((this.props as any).thumbnailSizes);

        if (sizesChanged) {
            this._activeLoaderId++;
            this.cleanupCurrentLoader();
            this.setState(
                { mainDecodedSrc: null, isThumbLoaded: false, triedFallback: false, decodeError: null },
                () => {
                    if (this.props.priority || this.state.isInView) this.startPreload();
                },
            );
            this.clearMediaListeners();
            this.setupMediaListeners();
        }
        if (!prev.priority && this.props.priority) this.setState({ isInView: true }, () => this.startPreload());
    }

    componentWillUnmount() {
        this._isMounted = false;
        this.observer?.disconnect();
        this.observer = null;
        this._activeLoaderId++;
        this.cleanupCurrentLoader();
        if (this._idleHandle != null) {
            try {
                if (typeof (window as any).cancelIdleCallback === "function")
                    (window as any).cancelIdleCallback(this._idleHandle);
                else clearTimeout(this._idleHandle);
            } catch {}
            this._idleHandle = null;
        }
        this.clearMediaListeners();
    }

    private initObserver() {
        if (!this.containerRef.current || typeof window === "undefined" || !("IntersectionObserver" in window)) {
            if (!this.state.isInView) this.setState({ isInView: true }, () => this.startPreload());
            return;
        }
        this.observer = new IntersectionObserver(
            (entries) => {
                for (const e of entries)
                    if (e.isIntersecting && this._isMounted) {
                        this.setState({ isInView: true }, () => this.startPreload());
                        this.observer?.disconnect();
                        break;
                    }
            },
            { root: null, rootMargin: "200px", threshold: 0.01 },
        );
        try {
            this.observer.observe(this.containerRef.current);
        } catch {
            if (!this.state.isInView) this.setState({ isInView: true }, () => this.startPreload());
        }
    }

    private shouldIdlePreload() {
        try {
            const conn = (navigator as any).connection || {};
            if (conn?.saveData) return false;
            const t = (conn?.effectiveType || "").toLowerCase();
            return t === "4g" || t === "";
        } catch {
            return false;
        }
    }

    private scheduleIdlePreloadIfAppropriate() {
        if (!this.shouldIdlePreload() || this.state.mainDecodedSrc) return;
        const cb = () => {
            if (!this._isMounted) return;
            if (!this.state.mainDecodedSrc && !this.state.isInView) this.startPreload();
        };
        if (typeof (window as any).requestIdleCallback === "function")
            this._idleHandle = (window as any).requestIdleCallback(cb, { timeout: 1500 });
        else this._idleHandle = window.setTimeout(cb, 1200) as unknown as number;
    }

    private withTimeout<T>(p: Promise<T>, ms: number) {
        return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
    }

    private resolveResponsiveUrl(mapOrString?: string | Record<string, string>, defaultUrl?: string) {
        if (!mapOrString) return defaultUrl;
        if (typeof mapOrString === "string") return defaultUrl;
        if (typeof window === "undefined") return defaultUrl;
        try {
            for (const [media, url] of Object.entries(mapOrString)) {
                if (!url) continue;
                try {
                    if (window.matchMedia(media).matches) return url;
                } catch {}
            }
        } catch {}
        return defaultUrl;
    }

    private loadUrlOnceViaFetch(url: string) {
        if (!url) return Promise.reject(new Error("no url"));
        try {
            if (typeof url === "string" && (url.startsWith("blob:") || url.startsWith("data:"))) {
                if (!OptimizedMedia.objectUrlMap.has(url)) {
                    OptimizedMedia.objectUrlMap.set(url, url);
                    OptimizedMedia.objectUrlOrder.push(url);
                }
                return Promise.resolve();
            }
        } catch {}

        if (OptimizedMedia.objectUrlMap.has(url)) return Promise.resolve();
        const existing = OptimizedMedia.loadPromises.get(url);
        if (existing) return existing;

        const credentials: RequestCredentials = this.props.crossOrigin === "use-credentials" ? "include" : "omit";
        const p = fetch(url, { credentials, cache: "force-cache", mode: "cors" })
            .then((res) => {
                if (!res.ok) throw new Error("fetch failed: " + res.status);
                return res.blob();
            })
            .then((blob) => {
                const obj = URL.createObjectURL(blob);
                try {
                    OptimizedMedia.objectUrlMap.set(url, obj);
                    OptimizedMedia.decodedImageUrls.add(url);
                    if (typeof obj === "string" && obj.startsWith("blob:")) {
                        OptimizedMedia.createdObjectUrls.add(obj);
                    }
                    OptimizedMedia.objectUrlOrder.push(url);
                    this.maybeEvictObjectUrlCache();
                } catch {}
            })
            .finally(() => OptimizedMedia.loadPromises.delete(url));

        OptimizedMedia.loadPromises.set(url, p);
        return p;
    }

    private maybeEvictObjectUrlCache() {
        try {
            const limit = OptimizedMedia.OBJECT_URL_CACHE_LIMIT;
            while (OptimizedMedia.objectUrlOrder.length > limit) {
                const orig = OptimizedMedia.objectUrlOrder.shift();
                if (!orig) continue;
                const mapped = OptimizedMedia.objectUrlMap.get(orig);
                if (!mapped) {
                    OptimizedMedia.objectUrlMap.delete(orig);
                    continue;
                }
                if (
                    typeof mapped === "string" &&
                    mapped.startsWith("blob:") &&
                    mapped !== orig &&
                    OptimizedMedia.createdObjectUrls.has(mapped)
                ) {
                    try {
                        URL.revokeObjectURL(mapped);
                    } catch {}
                    OptimizedMedia.createdObjectUrls.delete(mapped);
                }
                OptimizedMedia.objectUrlMap.delete(orig);
                OptimizedMedia.decodedImageUrls.delete(orig);
            }
        } catch {}
    }

    private async startPreload() {
        const t = this.props.type ?? "image";
        if (t === "video") await this.startVideoPreload();
        else await this.startImagePreload();
    }

    private cleanupCurrentLoader() {
        if (!this._currentLoaderElement) return;
        try {
            (this._currentLoaderElement as any).onload = null;
            (this._currentLoaderElement as any).onerror = null;
            try {
                this._currentLoaderElement.src = "";
            } catch {}
        } catch {}
        this._currentLoaderElement = null;
    }

    private async startImagePreload() {
        const { src, fallbackSrc, srcSet, sizes, decodeTimeoutMs = 15000 } = this.props;
        const loaderId = ++this._activeLoaderId;
        const chosenOriginal = this.resolveResponsiveUrl(sizes as any, src) || src;
        if (!chosenOriginal) {
            this.setState({ decodeError: new Error("no source") });
            return;
        }

        if (OptimizedMedia.objectUrlMap.has(chosenOriginal)) {
            const obj = OptimizedMedia.objectUrlMap.get(chosenOriginal)!;
            if (!this._isMounted || loaderId !== this._activeLoaderId) return;
            this.setState({ mainDecodedSrc: obj, decodeError: null }, () => this.reportLoad(chosenOriginal, false));
            return;
        }

        try {
            await this.withTimeout(this.loadUrlOnceViaFetch(chosenOriginal), decodeTimeoutMs);
            if (!this._isMounted || loaderId !== this._activeLoaderId) return;
            const obj = OptimizedMedia.objectUrlMap.get(chosenOriginal) || chosenOriginal;
            const cacheKey = `${chosenOriginal}|${srcSet || ""}|${typeof sizes === "string" ? sizes : JSON.stringify(sizes || {})}`;
            OptimizedMedia.decodedImageCache.set(cacheKey, true);
            this.setState({ mainDecodedSrc: obj, decodeError: null }, () => this.reportLoad(chosenOriginal, false));
            return;
        } catch {}

        if (fallbackSrc && !this.state.triedFallback) {
            try {
                await this.withTimeout(this.loadUrlOnceViaFetch(fallbackSrc), decodeTimeoutMs);
                if (!this._isMounted || loaderId !== this._activeLoaderId) return;
                const obj = OptimizedMedia.objectUrlMap.get(fallbackSrc) || fallbackSrc;
                const fallbackKey = `${fallbackSrc}|${srcSet || ""}|${typeof sizes === "string" ? sizes : JSON.stringify(sizes || {})}`;
                OptimizedMedia.decodedImageCache.set(fallbackKey, true);
                this.setState({ mainDecodedSrc: obj, triedFallback: true, decodeError: null }, () =>
                    this.reportLoad(fallbackSrc, true),
                );
                return;
            } catch (err) {
                if (!this._isMounted || loaderId !== this._activeLoaderId) return;
                this.setState({ decodeError: err as Error, triedFallback: true });
                return;
            }
        }

        if (!this._isMounted || loaderId !== this._activeLoaderId) return;
        this.setState({ decodeError: new Error("main decode failed") });
    }

    private async startVideoPreload() {
        const { src, fallbackSrc, sources, decodeTimeoutMs = 15000 } = this.props;
        const loaderId = ++this._activeLoaderId;
        const key = src || (sources && sources[0]?.src) || "";
        if (key && OptimizedMedia.readyVideoCache.has(key)) {
            if (!this._isMounted || loaderId !== this._activeLoaderId) return;
            this.setState({ mainDecodedSrc: key, decodeError: null }, () => this.reportLoad(key, false));
            return;
        }

        const attempt = (url?: string, srcList?: VideoSource[]) =>
            new Promise<void>((resolve, reject) => {
                if (!this._isMounted || loaderId !== this._activeLoaderId) return reject(new Error("cancelled"));
                const video = document.createElement("video");
                this._currentLoaderElement = video;
                if (this.props.crossOrigin) video.crossOrigin = this.props.crossOrigin;
                video.preload = this.props.priority ? "auto" : "metadata";
                video.muted = true;
                video.playsInline = true;
                if (srcList && srcList.length) {
                    for (const s of srcList) {
                        const sourceEl = document.createElement("source");
                        sourceEl.src = s.src;
                        if (s.type) sourceEl.type = s.type;
                        video.appendChild(sourceEl);
                    }
                } else if (url) video.src = url;

                let settled = false;
                const cleanup = () => {
                    try {
                        video.removeEventListener("canplaythrough", onReady);
                        video.removeEventListener("loadeddata", onReady);
                        video.removeEventListener("error", onErr);
                        try {
                            video.pause();
                            video.src = "";
                        } catch {}
                    } catch {}
                };
                const onReady = () => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    resolve();
                };
                const onErr = () => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    reject(new Error("video error"));
                };
                video.addEventListener("canplaythrough", onReady, { once: true });
                video.addEventListener("loadeddata", onReady, { once: true });
                video.addEventListener("error", onErr, { once: true });
                try {
                    video.load();
                } catch {
                    // swallow
                }
            });

        try {
            if (sources && sources.length) {
                await this.withTimeout(attempt("", sources), decodeTimeoutMs);
                if (!this._isMounted || loaderId !== this._activeLoaderId) return;
                const k = sources[0].src;
                OptimizedMedia.readyVideoCache.set(k, true);
                this.setState({ mainDecodedSrc: k, decodeError: null }, () => this.reportLoad(k, false));
                return;
            } else if (src) {
                await this.withTimeout(attempt(src), decodeTimeoutMs);
                if (!this._isMounted || loaderId !== this._activeLoaderId) return;
                OptimizedMedia.readyVideoCache.set(src, true);
                this.setState({ mainDecodedSrc: src, decodeError: null }, () => this.reportLoad(src, false));
                return;
            }
        } catch {}

        if (fallbackSrc && !this.state.triedFallback) {
            try {
                await this.withTimeout(attempt(fallbackSrc), decodeTimeoutMs);
                if (!this._isMounted || loaderId !== this._activeLoaderId) return;
                OptimizedMedia.readyVideoCache.set(fallbackSrc, true);
                this.setState({ mainDecodedSrc: fallbackSrc, triedFallback: true, decodeError: null }, () =>
                    this.reportLoad(fallbackSrc, true),
                );
                return;
            } catch (err) {
                if (!this._isMounted || loaderId !== this._activeLoaderId) return;
                this.setState({ decodeError: err as Error, triedFallback: true });
                return;
            }
        }

        if (!this._isMounted || loaderId !== this._activeLoaderId) return;
        this.setState({ decodeError: new Error("video prepare failed") });
    }

    private handleThumbLoad = () => {
        if (!this._isMounted) return;
        try {
            const { thumbnail, thumbnailSizes } = this.props;
            const selected = this.resolveResponsiveUrl(thumbnailSizes, thumbnail) || thumbnail;
            if (selected) OptimizedMedia.decodedImageUrls.add(selected);
        } catch {}
        this.setState({ isThumbLoaded: true }, () => {
            if (!this.state.mainDecodedSrc) this.startPreload();
        });
    };

    private reportLoad(src: string, usedFallback: boolean) {
        try {
            this.props.onLoadComplete?.({ src, usedFallback });
        } catch {}
    }

    private setupMediaListeners() {
        const sizes = this.props.sizes as any;
        const thumbnailSizes = this.props.thumbnailSizes as any;
        this.mediaListeners = [];

        const addFor = (map?: Record<string, string>) => {
            if (!map || typeof map !== "object") return;
            for (const [media, url] of Object.entries(map)) {
                if (!url) continue;
                try {
                    const mql = window.matchMedia(media);
                    const listener = (e: MediaQueryListEvent) => {
                        if (!e.matches) return;
                        this.loadUrlOnceAndSetIfActive(url).catch(() => {});
                    };
                    this.mediaListeners.push({ media, url, mql, listener });
                    if ((mql as any).addEventListener) (mql as any).addEventListener("change", listener);
                    else (mql as any).addListener(listener);
                    if (mql.matches) this.loadUrlOnceAndSetIfActive(url).catch(() => {});
                } catch {}
            }
        };

        addFor(sizes);
        addFor(thumbnailSizes);
    }

    private clearMediaListeners() {
        for (const entry of this.mediaListeners) {
            try {
                if ((entry.mql as any).removeEventListener)
                    (entry.mql as any).removeEventListener("change", entry.listener);
                else (entry.mql as any).removeListener(entry.listener);
            } catch {}
        }
        this.mediaListeners = [];
    }

    private async loadUrlOnceAndSetIfActive(url: string) {
        if (!url) return;
        if (OptimizedMedia.objectUrlMap.has(url)) {
            const obj = OptimizedMedia.objectUrlMap.get(url)!;
            if (!this._isMounted) return;
            this.setState({ mainDecodedSrc: obj, decodeError: null }, () => this.reportLoad(url, false));
            return;
        }
        try {
            await this.loadUrlOnceViaFetch(url);
            if (!this._isMounted) return;
            const obj = OptimizedMedia.objectUrlMap.get(url) || url;
            this.setState({ mainDecodedSrc: obj, decodeError: null }, () => this.reportLoad(url, false));
        } catch {}
    }

    private mapUrlToObject(url?: string) {
        if (!url) return undefined;
        try {
            if (typeof url === "string" && url.startsWith("blob:")) return url;
        } catch {}
        return OptimizedMedia.objectUrlMap.get(url) || undefined;
    }

    private renderPictureFor = (
        currentSrc?: string | undefined,
        map?: Record<string, string> | undefined,
        imgProps: any = {},
    ) => {
        if (!map || typeof map !== "object" || Object.keys(map).length === 0) {
            const imgSrc =
                this.mapUrlToObject(currentSrc) ||
                (currentSrc && (currentSrc as string).startsWith("blob:") ? currentSrc : currentSrc);
            return <img {...imgProps} src={imgSrc} />;
        }

        const sourcesEls = Object.entries(map)
            .filter(([, url]) => {
                if (!url) return false;
                if (OptimizedMedia.objectUrlMap.has(url)) return true;
                if (typeof url === "string" && (url.startsWith("blob:") || url.startsWith("data:"))) {
                    try {
                        if (!OptimizedMedia.objectUrlMap.has(url)) {
                            OptimizedMedia.objectUrlMap.set(url, url);
                            OptimizedMedia.objectUrlOrder.push(url);
                        }
                        return true;
                    } catch {}
                }
                return false;
            })
            .map(([media, url], i) => {
                const mapped = OptimizedMedia.objectUrlMap.get(url)!;
                return <source key={i} media={media} srcSet={mapped} />;
            });

        let imgSrc: string | undefined;
        if (currentSrc && (currentSrc as string).startsWith("blob:")) imgSrc = currentSrc;
        else imgSrc = this.mapUrlToObject(currentSrc) || undefined;

        return (
            <picture>
                {sourcesEls}
                {imgSrc ? (
                    <img {...imgProps} src={imgSrc} />
                ) : (
                    <img {...imgProps} style={{ visibility: "hidden", width: "100%", height: "100%" }} />
                )}
            </picture>
        );
    };

    render(): ReactNode {
        const {
            alt,
            thumbnail,
            containerStyle,
            className,
            imageClassname,
            loadingMessage,
            no_image_height,
            aspect_16_9,
            no_aspect,
            imagePropsStyle,
            srcSet,
            sizes,
            thumbnailSizes,
            priority,
            underWrapperClassname,
            crossfadeMs = 120,
            type = "image",
            videoProps,
            sources,
        } = this.props;
        const { mainDecodedSrc, isThumbLoaded } = this.state;

        const loaderIsLoaded = Boolean(mainDecodedSrc) || (thumbnail ? isThumbLoaded : false);
        const containerClassNames = [
            className || "",
            styles.imageWrapper,
            no_image_height ? styles.no_image_height : "",
            aspect_16_9 ? styles.aspect_16_9 : "",
            no_aspect ? styles.no_aspect : "",
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <div
                ref={this.containerRef}
                style={containerStyle}
                className={containerClassNames}
                aria-busy={!loaderIsLoaded}
            >
                <BlockLoader
                    isLoaded={loaderIsLoaded}
                    loadingMessage={loadingMessage || ""}
                    containerStyle={{ width: "100%", height: "100%" }}
                    className={styles.loadingWrapper}
                    underWrapperClassname={underWrapperClassname}
                >
                    {!mainDecodedSrc &&
                        thumbnail &&
                        (() => {
                            const thumbSelectedOriginal =
                                this.resolveResponsiveUrl(thumbnailSizes as any, thumbnail) || thumbnail;
                            if (
                                thumbnailSizes &&
                                typeof thumbnailSizes === "object" &&
                                Object.keys(thumbnailSizes).length
                            ) {
                                return this.renderPictureFor(
                                    OptimizedMedia.objectUrlMap.get(thumbSelectedOriginal || thumbnail) ||
                                        thumbSelectedOriginal ||
                                        thumbnail,
                                    thumbnailSizes as Record<string, string>,
                                    {
                                        ref: this.thumbImgRef,
                                        alt: "",
                                        "aria-hidden": true,
                                        decoding: "async",
                                        loading: "lazy",
                                        onLoad: this.handleThumbLoad,
                                        className: `${styles.thumbnailImage} ${isThumbLoaded ? styles.thumbnailLoaded : ""}`,
                                        style: { pointerEvents: "none" },
                                    },
                                );
                            } else {
                                return (
                                    <img
                                        ref={this.thumbImgRef}
                                        src={this.mapUrlToObject(thumbnail) || thumbnail}
                                        alt=""
                                        aria-hidden
                                        decoding="async"
                                        loading="lazy"
                                        onLoad={this.handleThumbLoad}
                                        className={`${styles.thumbnailImage} ${isThumbLoaded ? styles.thumbnailLoaded : ""}`}
                                        style={{ pointerEvents: "none" }}
                                    />
                                );
                            }
                        })()}

                    {type === "image" ? (
                        mainDecodedSrc ? (
                            (() => {
                                if (sizes && typeof sizes === "object") {
                                    return this.renderPictureFor(
                                        mainDecodedSrc || this.props.src,
                                        sizes as Record<string, string>,
                                        {
                                            ref: this.mainImgRef,
                                            alt: alt || "",
                                            loading: priority ? "eager" : "lazy",
                                            decoding: "async",
                                            fetchPriority: priority ? "high" : undefined,
                                            className: `${imageClassname || ""} ${styles.mainImage} ${styles.mainImageLoaded}`,
                                            style: {
                                                opacity: 1,
                                                transition: `opacity ${Math.max(0, crossfadeMs)}ms ease`,
                                                ...imagePropsStyle,
                                            },
                                        },
                                    );
                                } else {
                                    return (
                                        <img
                                            ref={this.mainImgRef}
                                            src={mainDecodedSrc}
                                            srcSet={srcSet}
                                            sizes={typeof sizes === "string" ? sizes : undefined}
                                            alt={alt || ""}
                                            loading={priority ? "eager" : "lazy"}
                                            decoding="async"
                                            fetchPriority={priority ? "high" : undefined}
                                            className={`${imageClassname || ""} ${styles.mainImage} ${styles.mainImageLoaded}`}
                                            style={{
                                                opacity: 1,
                                                transition: `opacity ${Math.max(0, crossfadeMs)}ms ease`,
                                                ...imagePropsStyle,
                                            }}
                                        />
                                    );
                                }
                            })()
                        ) : (
                            !thumbnail && (
                                <img
                                    ref={this.mainImgRef}
                                    src={priority ? this.props.src : undefined}
                                    srcSet={priority ? srcSet : undefined}
                                    sizes={priority && typeof sizes === "string" ? sizes : undefined}
                                    alt={alt || ""}
                                    loading={priority ? "eager" : "lazy"}
                                    decoding="async"
                                    fetchPriority={priority ? "high" : undefined}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", visibility: "hidden" }}
                                />
                            )
                        )
                    ) : mainDecodedSrc ? (
                        <video
                            ref={this.mainVideoRef}
                            {...(videoProps || {})}
                            preload={priority ? "auto" : (videoProps?.preload ?? "metadata")}
                            src={sources && sources.length ? undefined : mainDecodedSrc}
                            className={`${(videoProps && (videoProps.className || "")) || ""} ${styles.mainImage} ${styles.mainImageLoaded}`}
                        >
                            {sources && sources.map((s, i) => <source key={i} src={s.src} type={s.type} />)}
                            {videoProps?.children}
                        </video>
                    ) : (
                        !thumbnail &&
                        priority && (
                            <video
                                ref={this.mainVideoRef}
                                preload="auto"
                                style={{ width: "100%", height: "100%", visibility: "hidden" }}
                            >
                                {sources && sources.map((s, i) => <source key={i} src={s.src} type={s.type} />)}
                                {!sources && <source src={this.props.src} />}
                            </video>
                        )
                    )}
                </BlockLoader>
            </div>
        );
    }
}
