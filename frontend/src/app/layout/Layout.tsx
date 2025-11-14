import { PureComponent, ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { createPortal } from "react-dom";
import Main from "./Main";
import LoadingLine from "components/Loaders/LoadingLine";

class Layout extends PureComponent {
    render(): ReactNode {
        return (
            <BrowserRouter>
                {createPortal(<LoadingLine />, document.body)}
                <Main />
            </BrowserRouter>
        );
    }
}

export default Layout;
