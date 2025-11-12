import { PureComponent, ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { createPortal } from "react-dom";
import Header from "./Header";
import Main from "./Main";
import Footer from "./Footer";
import LoadingLine from "components/Loaders/LoadingLine";

class Layout extends PureComponent {
    render(): ReactNode {
        return (
            <BrowserRouter>
                {createPortal(<LoadingLine />, document.body)}
                <Header />
                <Main />
                <Footer />
            </BrowserRouter>
        );
    }
}

export default Layout;
