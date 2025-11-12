import { withoutLangPathname } from "./withoutLangPathname";
import { className } from "./className";

export interface NavLinkItem {
    to: string;
    className: string | (() => string);
    tKey?: string;
}

export function isCurrentPath(pathname: string): boolean {
    const pathWithoutLang: string = withoutLangPathname();
    return pathWithoutLang === pathname;
}

export function activeClassNameObserver(pathname: string, _className: string, activeClassName?: string): string {
    return className(_className, {
        [activeClassName ?? "active"]: isCurrentPath(pathname),
    });
}
