import "./App.scss"; // adds custom view transition animations
import { lazyLoaded } from "HOCs/lazyLoaded";
import { PureComponent, lazy, ReactNode } from "react";
import { createPortal } from "react-dom";
import ErrorBoundary from "components/Error/ErrorBoundary";
import InternetState from "components/InternetState/InternetState";

const Layout = lazyLoaded(lazy(() => import("app/layout/Layout")));

class App extends PureComponent {
    render(): ReactNode {
        return (
            <ErrorBoundary>
                <Layout />
                {createPortal(<InternetState />, document.body)}
            </ErrorBoundary>
        );
    }
}

export default App;
