import { PureComponent, ReactNode } from "react";
import styles from "./Logo.module.scss";
import NavigationLink from "components/Link/NavigationLink";

class Logo extends PureComponent {
    render(): ReactNode {
        return (
            <NavigationLink to="/" className={styles.logo}>
                <img src="logo" />
            </NavigationLink>
        );
    }
}

export default Logo;
