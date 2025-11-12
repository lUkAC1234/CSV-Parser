import styles from "./Main.module.scss";
import { mobx } from "decorators/MobxStore";
import { Component, ReactNode } from "react";
import { Outlet, Route, Routes } from "react-router-dom";

@mobx
class Main extends Component {
    render(): ReactNode {
        const { routes } = this.store.routerStore;
        return (
            <main className={styles.main}>
                <Routes>
                    {routes.map((route) => (
                        <Route {...route} />
                    ))}
                </Routes>
                <Outlet />
            </main>
        );
    }
}

export default Main;
