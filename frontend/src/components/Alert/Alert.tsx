import { PureComponent, ReactNode } from "react";
import { createPortal } from "react-dom";

import "./Alert.scss";
import CloseButton from "components/Buttons/CloseButton";
import { className } from "utils/functions/className";
import SmoothResizable from "components/SmoothResizable/SmoothResizable";

type AlertPosition = "top" | "bottom" | "left" | "right" | "center" | "center-x" | "center-y";

interface Props {
    message: string;
    isOpen: boolean;
    toggleAlert?: () => void;
    local?: boolean;
    withWrap?: boolean;
    textAlign?: "left" | "center" | "right";
    animationDuration?: number;
    removeCloseBtn?: boolean;
    positions?: AlertPosition[];
}

interface State {
    isBlurred: boolean;
    canBeRemoved: boolean;
    shouldAnimate: boolean;
}

const defaultPositions: AlertPosition[] = ["top", "right"];
const centerXY: AlertPosition[] = ["center-x", "center-y"];

class Alert extends PureComponent<Props, State> {
    state: Readonly<State> = {
        isBlurred: false,
        canBeRemoved: this.props.isOpen,
        shouldAnimate: false,
    };

    private hideTimeout?: number;
    private animateTimeout?: number;

    get alertClassName(): string {
        const positions = this.props.positions?.flatMap((p) => (p === "center" ? centerXY : [p])) ?? defaultPositions;

        const positionsExtend: Record<string, boolean> = {};
        for (const position of positions) positionsExtend[`alert--${position}`] = true;

        return className("alert", {
            "alert--active": this.state.shouldAnimate,
            ...positionsExtend,
        });
    }

    get alertWrapClassName(): string {
        return className("alert-wrap", {
            "alert-wrap--blurred": this.state.isBlurred,
        });
    }

    get alertContentClassName(): string {
        return className("alert-content", {
            "alert-content--center": this.props.textAlign === "center",
            "alert-content--right": this.props.textAlign === "right",
        });
    }

    handleHoverStart = () => this.setState({ isBlurred: true });
    handleHoverEnd = () => this.setState({ isBlurred: false });

    componentDidMount(): void {
        const { isOpen, animationDuration = 300 } = this.props;

        if (isOpen) {
            this.setState({ canBeRemoved: true, shouldAnimate: false }, () => {
                this.animateTimeout = window.setTimeout(() => {
                    this.setState({ shouldAnimate: true });
                }, 20);
            });
        } else {
            this.setState({ shouldAnimate: false });
            this.hideTimeout = window.setTimeout(() => {
                this.setState({ canBeRemoved: false });
            }, animationDuration);
        }
    }

    componentDidUpdate(prevProps: Props) {
        const { isOpen, animationDuration = 300 } = this.props;

        if (isOpen && !prevProps.isOpen) {
            this.setState({ canBeRemoved: true, shouldAnimate: false }, () => {
                this.animateTimeout = window.setTimeout(() => {
                    this.setState({ shouldAnimate: true });
                }, 20);
            });
        }

        if (!isOpen && prevProps.isOpen) {
            this.setState({ shouldAnimate: false });
            this.hideTimeout = window.setTimeout(() => {
                this.setState({ canBeRemoved: false });
            }, animationDuration);
        }
    }

    componentWillUnmount() {
        if (this.hideTimeout) clearTimeout(this.hideTimeout);
        if (this.animateTimeout) clearTimeout(this.animateTimeout);
    }

    render(): ReactNode {
        const { message, local, toggleAlert, withWrap } = this.props;
        const { canBeRemoved } = this.state;

        if (!canBeRemoved) return null;

        const templateOrdinary: ReactNode = (
            <div
                className={this.alertClassName}
                onMouseEnter={this.handleHoverStart}
                onMouseLeave={this.handleHoverEnd}
                onTouchStart={this.handleHoverStart}
                onTouchEnd={this.handleHoverEnd}
                onTouchCancel={this.handleHoverEnd}
            >
                {!!toggleAlert && <CloseButton position="absolute" alignX="right" alignY="top" onClick={toggleAlert} />}
                <SmoothResizable>
                    <div className={this.alertContentClassName}>
                        <span>{message}</span>
                    </div>
                </SmoothResizable>
            </div>
        );

        const wrapper = withWrap ? <div className={this.alertWrapClassName}>{templateOrdinary}</div> : templateOrdinary;

        return local ? wrapper : createPortal(wrapper, document.body);
    }
}

export default Alert;
