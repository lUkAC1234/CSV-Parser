import styles from "./PaddingContainer.module.scss";
import { createElement, ElementType, PureComponent, ReactNode, ComponentPropsWithoutRef, Ref } from "react";

type Props<E extends ElementType = "div"> = {
    as?: E;
    children?: ReactNode;
    className?: string;
    elementRef?: Ref<any>;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children" | "className">;

class Container<E extends ElementType = "div"> extends PureComponent<Props<E>> {
    static defaultProps = { as: "div" } as Partial<Props<any>>;

    render() {
        const { as: Component = "div", children, className, elementRef, ...rest } = this.props as Props<any>;
        const baseClass = styles["padding-container"];
        const combinedClassName = className ? `${baseClass} ${className}` : baseClass;
        return createElement(Component, { ...(rest as any), className: combinedClassName, ref: elementRef }, children);
    }
}
export default Container;
