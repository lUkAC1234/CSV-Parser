// Home.tsx
import { Component, ReactNode } from "react";
import { title } from "decorators/Title";
import styles from "./Home.module.scss";
import { scrollToTop } from "utils/functions/scrollToTop";
import CsvUploadSection from "./Sections/CsvUploadSection";
import MainSection from "./Sections/MainSection";

@title((self) => ({
    title: self.store.localeStore.t("pages.home"),
}))
class Home extends Component<any> {
    componentDidMount(): void {
        scrollToTop();
    }

    onLogout = async () => {
        await this.store.usersStore.logout();
    };

    render(): ReactNode {
        const { usersStore } = this.store;
        const isAuth = Boolean(usersStore.user);
        return (
            <div className={styles["home-wrapper"]}>
                {!isAuth ? (
                    <MainSection />
                ) : (
                    <>
                        <div className={styles["button-container"]}>
                            <button className={styles.button} onClick={this.onLogout}>Logout</button>
                        </div>
                        <CsvUploadSection />
                    </>
                )}
            </div>
        );
    }
}

export default Home;
