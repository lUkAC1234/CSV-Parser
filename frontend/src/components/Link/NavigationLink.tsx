import { Component, PropsWithChildren, ReactNode, RefObject } from "react";
import { NavLink, Link, To } from "react-router-dom";
import { mobx } from "decorators/MobxStore";

interface Props extends PropsWithChildren {
    to: To;
    className?: string | (() => string);
    title?: string;
    withoutNavLink?: boolean;
    navRef?: RefObject<HTMLAnchorElement | null>;
    end?: boolean;
    caseSensitive?: boolean;
}

@mobx
class NavigationLink extends Component<Props> {
    render(): ReactNode {
        const { to, withoutNavLink, className, title, children, navRef, end, caseSensitive } = this.props;
        const toUrl: string = `/${this.store.localeStore.lang}${to === "/" ? "" : to}`;

        if (withoutNavLink) {
            return (
                <Link to={toUrl} className={className as string | undefined} title={title} ref={navRef}>
                    {children}
                </Link>
            );
        }

        return (
            <NavLink
                to={toUrl}
                className={className}
                title={title}
                ref={navRef}
                end={end}
                caseSensitive={caseSensitive}
            >
                {children}
            </NavLink>
        );
    }
}

export default NavigationLink;
