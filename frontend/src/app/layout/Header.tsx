import { Component, ReactNode } from "react";
import { mobx } from "decorators/MobxStore";
import { bound } from "decorators/Bound";
import { className } from "utils/functions/className";
import styles from "./Header.module.scss";
import Nav from "./Nav";
import Logo from "./Logo";
import LangSelect from "components/Lang/LangSelect";

interface State {
    isHidden: boolean;
    lastScrollY: number;
}

@mobx
class Header extends Component<object, State> {
    state: State = {
        isHidden: false,
        lastScrollY: 0,
    };

    get headerClass(): string {
        return className(styles["header"], {
            [styles["header--hidden"]]: this.state.isHidden,
        });
    }

    @bound
    handleScroll(): void {
        const currentScrollY = window.scrollY || window.pageYOffset;
        const goingDown = currentScrollY > this.state.lastScrollY && currentScrollY > 50;
        const goingUp = currentScrollY < this.state.lastScrollY;

        let newState: Partial<State> = { lastScrollY: currentScrollY };

        if (goingDown && !this.state.isHidden) {
            newState.isHidden = true;
        } else if (goingUp && this.state.isHidden) {
            newState.isHidden = false;
        }

        if (Object.keys(newState).length > 0) {
            this.setState(newState as State);
        }
    }

    componentDidMount(): void {
        window.addEventListener("scroll", this.handleScroll, { passive: true });
    }

    componentWillUnmount(): void {
        window.removeEventListener("scroll", this.handleScroll);
    }

    render(): ReactNode {
        return (
            <header className={this.headerClass}>
                {/* <div className={styles["header-wrap"]}>
                    <div className={styles["logo-wrap"]}>
                        <Logo />
                    </div>
                    {this.store.windowStore.width >= 639 && (
                        <div className={styles["nav-wrap"]}>
                            <Nav />
                        </div>
                    )}
                    <div className={styles["account-wrap"]}>
                        <LangSelect />
                    </div>
                </div> */}
            </header>
        );
    }
}

export default Header;
