import { Component, ReactNode } from "react";
import { title } from "decorators/Title";
import { scrollToTop } from "utils/functions/scrollToTop";
import styles from "./404.module.scss";
import Container from "components/Container/PaddingContainer";

@title((self) => ({
    title: self.store.localeStore.t("pages.404"),
}))
class Error404 extends Component {
    componentDidMount(): void {
        scrollToTop();
    }

    render(): ReactNode {
        const { t } = this.store.localeStore;
        return (
            <Container as="section" className={styles["videos"]}>
                <div className={styles["container"]}>
                    <h1 className={styles["error-container"]}>
                        <span className={styles["error-code"]}>4</span>
                        <span className={styles["error-code"]}>0</span>
                        <span className={styles["error-code"]}>4</span>
                    </h1>
                    <p className={styles["description"]}>{t("page-404.description")}</p>
                </div>
            </Container>
        );
    }
}

export default Error404;
