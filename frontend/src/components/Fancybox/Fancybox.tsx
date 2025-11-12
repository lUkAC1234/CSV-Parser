import { debounce } from "lodash";
import { PropsWithChildren, Component, ReactNode, RefObject, createRef } from "react";
import { type OptionsType as FancyboxOptions } from "@fancyapps/ui/types/Fancybox/options";
import { IReactionDisposer, reaction } from "mobx";
import { mobx } from "decorators/MobxStore";
import { Log } from "utils/functions/logger";

import "@fancyapps/ui/dist/fancybox/fancybox.css";
import "./Fancybox.scss";
import LOCALES from "i18n/resources/fancybox/locales.json";

interface FancyboxProps extends PropsWithChildren {
    options?: Partial<FancyboxOptions>;
    delegate?: string;
    init?: () => void;
    destroy?: () => void;
    carouselReady?: () => void;
    setCurrentPage?: (page: number) => void;
}

@mobx
class Fancybox extends Component<FancyboxProps> {
    static NativeFancybox: typeof import("@fancyapps/ui").Fancybox;
    static loadedFancybox: boolean = false;

    containerRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
    disposeLangReaction: IReactionDisposer;
    mutationObserver: MutationObserver;

    defaultOptions: Partial<FancyboxOptions> = {
        on: {
            init: () => {
                this.store.fancyboxStore.setStatus(true);

                if (this.props.init) {
                    this.props.init();
                }
                document.body.classList.add("hide-scrollbar");
            },
            destroy: () => {
                this.store.fancyboxStore.setStatus(false);

                if (this.props.destroy) {
                    this.props.destroy();
                }
                document.body.classList.remove("hide-scrollbar");
                this.destroyMutationObserver();
            },
            "Carousel.ready": () => {
                if (this.props.carouselReady) {
                    this.props.carouselReady();
                }
                this.setupMutationObserver();
            },
        },
        Hash: false,
        contentClick: "iterateZoom",
        Images: {
            Panzoom: {
                maxScale: 2,
            },
        },
        Toolbar: {
            display: {
                left: ["prev", "infobar", "next"],
                middle: ["zoomIn", "zoomOut", "toggle1to1", "rotateCCW", "rotateCW"],
                right: ["slideshow", "download", "thumbs", "fullscreen", "close"],
            },
        },
        Thumbs: {
            type: "modern",
        },
    };

    async loadFancyboxModules(): Promise<void> {
        try {
            if (!Fancybox.loadedFancybox) {
                const module: typeof import("@fancyapps/ui") = await import("@fancyapps/ui");
                Fancybox.NativeFancybox = module.Fancybox;
            }

            this.bindNativebox();
        } catch (err) {
            Log.UIError(err);
        }
    }

    bindNativebox(lang?: string): void {
        const container = this.containerRef.current;
        const delegate = this.props.delegate || "[data-fancybox]";
        const options = {
            ...this.defaultOptions,
            ...this.props.options,
            l10n: {
                ...LOCALES[lang || this.store.localeStore.lang],
            },
        };

        Fancybox.NativeFancybox.bind(container, delegate, options);
    }

    destroyMutationObserver(): void {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
    }

    setupMutationObserver = debounce(() => {
        const fancyboxContainerNode: HTMLElement = document.querySelector(".fancybox__container");
        this.mutationObserver = new MutationObserver(this.mutationObserverCallback);
        this.mutationObserver.observe(fancyboxContainerNode, {
            childList: false,
            subtree: false,
            characterData: false,
            characterDataOldValue: false,
            attributes: true,
            attributeOldValue: false,
            attributeFilter: ["class"],
        });
    }, 50);

    mutationObserverCallback = debounce((mutations: MutationRecord[]): void => {
        if (!this.props.setCurrentPage) return;

        for (const mutation of mutations) {
            const target: HTMLElement = mutation.target as HTMLElement;
            const selectedFancyboxSlideNode: HTMLElement = target.querySelector(".fancybox__slide.is-selected");

            if (selectedFancyboxSlideNode) {
                const dataIndex: number = Number(selectedFancyboxSlideNode.getAttribute("data-index"));
                this.props.setCurrentPage(dataIndex);
            }
        }
    }, 50);

    async componentDidMount(): Promise<void> {
        await this.loadFancyboxModules();
        this.disposeLangReaction = reaction(
            () => this.store.localeStore.lang,
            (lang) => this.bindNativebox(lang),
        );
    }

    componentWillUnmount(): void {
        if (Fancybox.loadedFancybox) {
            Fancybox.NativeFancybox.destroy();
        }
        this.disposeLangReaction?.();
    }

    componentDidUpdate(prevProps: Readonly<FancyboxProps>): void {
        if (prevProps.options !== this.props.options) {
            Fancybox.NativeFancybox.unbind(this.containerRef.current);
            Fancybox.NativeFancybox.close();
        }
    }

    render(): ReactNode {
        return (
            <div ref={this.containerRef} className="fancybox-wrapper-container">
                {this.props.children}
            </div>
        );
    }
}

export default Fancybox;
