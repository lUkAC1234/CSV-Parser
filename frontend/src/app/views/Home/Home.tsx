import { Component, ReactNode } from "react";
import { title } from "decorators/Title";
import styles from "./Home.module.scss";
import { scrollToTop } from "utils/functions/scrollToTop";
import MainSection from "./Sections/MainSection";

@title((self) => ({
    title: self.store.localeStore.t("pages.home"),
}))
class Home extends Component {
    componentDidMount(): void {
        scrollToTop();
    }

    render(): ReactNode {
        return (
            <div className={styles["home-wrapper"]}>
                <MainSection />
            </div>
        );
    }
}

export default Home;
