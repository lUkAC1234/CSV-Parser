import { PropsWithChildren, Component, ReactNode, ErrorInfo, CSSProperties } from "react";
import { mobx } from "decorators/MobxStore";
import { bound } from "decorators/Bound";

interface Props extends PropsWithChildren {
    local?: boolean;
    onError?: (error: globalThis.Error, errorInfo: ErrorInfo) => void;
}

interface State {
    error: boolean;
    tried: number;
}

const containerStyle: CSSProperties = {
    position: "fixed",
    left: 0,
    top: 0,
    width: "100%",
    height: "100dvh",
    display: "flex",
    flexFlow: "column",
    justifyContent: "center",
    alignItems: "center",
};

// const buttonStyle: CSSProperties = {
//     background: "var(--green)",
//     paddingInline: "1rem",
//     paddingBlock: "0.75rem",
//     borderRadius: "0.5rem",
// };

// const langSelectorStyle: CSSProperties = {
//     position: "fixed",
//     right: "2rem",
//     top: "2rem",
// };

@mobx
class ErrorBoundary extends Component<Props, State> {
    state: Readonly<State> = {
        error: false,
        tried: 0,
    };

    @bound
    reRunScript(): void {
        this.setState({ error: false });
    }

    @bound
    reloadPage(): void {
        location.reload();
    }

    @bound
    reloadBtnClick(): void {
        const reTryFn = this.props.local ? this.reRunScript : this.reloadPage;
        this.setState((prevState) => ({ tried: prevState.tried + 1 }));
        reTryFn();
    }

    componentDidCatch(error: globalThis.Error, errorInfo: ErrorInfo): void {
        this.setState({ error: true }, () => {
            this.props.onError(error, errorInfo);
        });
    }

    render(): ReactNode {
        const { children } = this.props;

        if (!this.state.error) {
            return children;
        }

        // const { t } = this.store.localeStore;
        // const clickFn = local ? this.reRunScript : this.reloadPage;

        return (
            <div style={containerStyle}>
                <h2>Error happened, reload page!</h2>
            </div>
        );
    }
}

export default ErrorBoundary;
