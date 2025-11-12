import { PureComponent, ReactNode } from "react";

class SVG_ArrowDown extends PureComponent<{ stroke?: string; className?: string }> {
    get computedStroke(): string {
        return this.props.stroke ?? "white";
    }

    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12.6666 6L7.99992 10.6667L3.33325 6"
                    stroke={this.computedStroke}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
}

export default SVG_ArrowDown;
