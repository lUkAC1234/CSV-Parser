import styles from "./LangSelect.module.scss";
import { mobx } from "decorators/MobxStore";
import { Component, createRef, ReactNode, RefObject } from "react";
import { langs } from "i18n/langs.json";
import { bound } from "decorators/Bound";
import { className } from "utils/functions/className";
import SVG_ArrowDown from "components/SVG/SVG_ArrowDown";
import { IReactionDisposer, reaction } from "mobx";

interface State {
    isOpen: boolean;
}

@mobx
class LangSelect extends Component<object, State> {
    state: Readonly<State> = {
        isOpen: false,
    };

    disposeReaction: IReactionDisposer;
    selectWrapRef: RefObject<HTMLDivElement | null> = createRef();

    get selectedLang(): string {
        const { lang } = this.store.localeStore;
        return langs.find(({ id }) => id === lang)?.children || "Select";
    }

    get langDropdownClass(): string {
        return className(styles["lang-dropdown"], {
            [styles["lang-dropdown--active"]]: this.state.isOpen,
        });
    }

    get langSelectBgClass(): string {
        return className(styles["lang-select-bg"], {
            [styles["lang-select-bg--active"]]: this.state.isOpen,
        });
    }

    get langSelectClass(): string {
        return className(styles["lang-select"], {
            [styles["lang-select--active"]]: this.state.isOpen,
        });
    }

    getLangOptionClass(id: string): string {
        return id === this.store.localeStore.lang
            ? `${styles["lang-option"]} ${styles["lang-option--active"]}`
            : `${styles["lang-option"]}`;
    }

    @bound
    toggleDropdown(): void {
        this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
    }

    @bound
    outsideClickHandler(evt: MouseEvent): void {
        if (!this.selectWrapRef.current?.contains(evt.target as Node) && this.state.isOpen) {
            this.toggleDropdown();
        }
    }

    componentDidMount(): void {
        this.disposeReaction = reaction(
            () => this.store.localeStore.lang,
            () => {
                if (this.state.isOpen) this.toggleDropdown();
            },
        );
        document.addEventListener("mousedown", this.outsideClickHandler);
    }

    componentWillUnmount(): void {
        this.disposeReaction?.();
        document.removeEventListener("mousedown", this.outsideClickHandler);
    }

    render(): ReactNode {
        const { setLocale } = this.store.localeStore;
        return (
            <div className={styles["lang-select-wrap"]} ref={this.selectWrapRef}>
                <button className={this.langSelectClass} type="button" onClick={this.toggleDropdown}>
                    {this.selectedLang}
                    <SVG_ArrowDown />
                </button>
                <div className={this.langDropdownClass}>
                    <ul className={styles["lang-list"]}>
                        {langs.map(({ id, children }) => (
                            <li key={id}>
                                <button
                                    type="button"
                                    onClick={() => setLocale(id)}
                                    className={this.getLangOptionClass(id)}
                                >
                                    {children}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }
}

export default LangSelect;
