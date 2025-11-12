import { Component, createRef, ReactNode, RefObject } from "react";
import { activeClassNameObserver } from "utils/functions/navLinks";
import { withoutLangPathname } from "utils/functions/withoutLangPathname";
import { IReactionDisposer, reaction } from "mobx";
import { mobx } from "decorators/MobxStore";
import { debounce } from "lodash";
import styles from "./Nav.module.scss";
import NavigationLink from "components/Link/NavigationLink";

@mobx
class Nav extends Component {
    navRef: RefObject<HTMLElement> = createRef();
    followerRef: RefObject<HTMLDivElement> = createRef();
    navRefMap: Map<string, RefObject<HTMLAnchorElement>> = new Map();
    resizeObserver: ResizeObserver;
    disposePathReaction: IReactionDisposer;

    setupResizeObserver(): void {
        if (!this.navRef.current) return;
        this.resizeObserver = new ResizeObserver(this.debouncedPathChanged);
        this.resizeObserver.observe(this.navRef.current);
    }

    destroyResizeObserver(): void {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
    }

    onPathChanged = (): void => {
        const currentPath: string = withoutLangPathname();
        const lastChar: string = currentPath[currentPath.length - 1];
        const finalPath: string = lastChar !== "/" ? currentPath : "/";
        const currentRefItem: RefObject<HTMLAnchorElement> = this.navRefMap.get(finalPath);
        const followerRef = this.followerRef.current;

        if (!followerRef) return;

        if (currentRefItem) {
            followerRef?.classList.remove(styles["follower--hidden"]);
            const currentRefEl: HTMLAnchorElement = currentRefItem.current;
            followerRef.style.transform = `translate(${currentRefEl?.offsetLeft}px)`;
            followerRef.style.width = `${currentRefEl?.offsetWidth}px`;
        } else {
            followerRef?.classList.add(styles["follower--hidden"]);
        }
    };

    debouncedPathChanged = debounce(this.onPathChanged, 100);

    componentDidMount(): void {
        this.disposePathReaction = reaction(() => this.store.routerStore.pathname, this.debouncedPathChanged, {
            fireImmediately: true,
        });
        this.setupResizeObserver();
    }

    componentWillUnmount(): void {
        this.disposePathReaction?.();
        this.destroyResizeObserver();
    }

    render(): ReactNode {
        const { links } = this.store.navigationStore;
        const { t } = this.store.localeStore;
        return (
            <nav className={styles["nav"]} ref={this.navRef}>
                <div className={styles["follower"]} ref={this.followerRef} />
                {links.map(({ id, href, name }) => {
                    if (!this.navRefMap.has(href)) this.navRefMap.set(href, createRef<HTMLAnchorElement>());
                    return (
                        <NavigationLink
                            key={id}
                            to={href}
                            navRef={this.navRefMap.get(href)}
                            className={() =>
                                activeClassNameObserver(href, styles["nav-link"], styles["nav-link--active"])
                            }
                        >
                            {t(name)}
                        </NavigationLink>
                    );
                })}
            </nav>
        );
    }
}

export default Nav;
