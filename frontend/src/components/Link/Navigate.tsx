import { mobx } from "decorators/MobxStore";
import { Component, ReactNode } from "react";
import { NavigateProps, Navigate as NavigateReactRouterDom } from "react-router-dom";

@mobx
class Navigate extends Component<NavigateProps> {
    render(): ReactNode {
        const { to, replace, state, relative, ...rest } = this.props;
        const { lang } = this.store.localeStore;

        return (
            <NavigateReactRouterDom
                to={`/${lang}${to === "/" ? "" : to}`}
                replace={replace}
                state={state}
                relative={relative}
                {...rest}
            />
        );
    }
}

export default Navigate;
