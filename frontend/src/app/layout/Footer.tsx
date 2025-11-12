import { Component, ReactNode } from "react";
import { activeClassNameObserver } from "utils/functions/navLinks";
import { mobx } from "decorators/MobxStore";
import styles from "./Footer.module.scss";
import NavigationLink from "components/Link/NavigationLink";

@mobx
class Footer extends Component {
    render(): ReactNode {
        const { links } = this.store.navigationStore;
        const { t } = this.store.localeStore;
        return (
            <footer className={styles["footer"]}>
                {/* <div className={styles["footer-container"]}>
                    <ul className={styles["footer-links"]}>
                        {links.map(({ id, href, name }) => {
                            return (
                                <li key={id}>
                                    <NavigationLink
                                        to={href}
                                        className={() =>
                                            activeClassNameObserver(href, styles["nav-link"], styles["nav-link--active"])
                                        }
                                    >
                                        {t(name)}
                                    </NavigationLink>
                                </li>
                            );
                        })}
                    </ul>
                </div> */}
            </footer>
        );
    }
}

export default Footer;
