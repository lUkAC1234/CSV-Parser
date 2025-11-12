import styles from "./CloseButton.module.scss";
import { CSSProperties, PureComponent, ReactNode } from "react";
import { PropsWithClassName } from "types/react-types";
import { className } from "utils/functions/className";

class SVG_CloseIcon extends PureComponent<{
    className?: string;
}> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g id="fi:x">
                    <path
                        id="Vector"
                        d="M24 8L8 24"
                        stroke="var(--white)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        id="Vector_2"
                        d="M8 8L24 24"
                        stroke="var(--white)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>
            </svg>
        );
    }
}

interface Props extends PropsWithClassName {
    position?: "absolute" | "fixed";
    alignX?: "left" | "right";
    alignY?: "top" | "bottom";
    style?: CSSProperties;
    onClick?: (evt: React.MouseEvent<HTMLButtonElement>) => void;
}

class CloseButton extends PureComponent<Props> {
    get closeButtonClassName(): string {
        const { position, alignX, alignY } = this.props;
        return className(styles["close-button"], {
            [this.getCloseBtnAlignClassName("left")]: alignX === "left",
            [this.getCloseBtnAlignClassName("right")]: alignX === "right",
            [this.getCloseBtnAlignClassName("bottom")]: alignY === "bottom",
            [this.getCloseBtnAlignClassName("top")]: alignY === "top",
            [this.getCloseBtnAlignClassName("absolute")]: position === "absolute",
            [this.getCloseBtnAlignClassName("fixed")]: position === "fixed",
            [this.props.className]: Boolean(this.props.className),
        });
    }

    getCloseBtnAlignClassName(align: "left" | "right" | "top" | "bottom" | "absolute" | "fixed"): string {
        return styles[`close-button--${align}`];
    }

    render(): ReactNode {
        return (
            <button
                type="button"
                className={this.closeButtonClassName}
                style={this.props.style}
                onClick={this.props.onClick}
            >
                <SVG_CloseIcon className={styles["close-button__svg"]} />
            </button>
        );
    }
}

export default CloseButton;
