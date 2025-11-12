import { ComponentType, type PureComponent } from "react";

export function setComponentName<T extends { new (...args: any[]): PureComponent }, S>(
    Class: T,
    constructor: T | ComponentType<S>,
    decoratorName: string,
): void {
    Class["displayName"] = `${decoratorName}(${constructor["displayName"] || constructor.name})`;
}
