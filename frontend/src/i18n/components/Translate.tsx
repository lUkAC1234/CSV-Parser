import { mobx } from "decorators/MobxStore";
import { Component, ReactNode } from "react";

interface Props {
    tKey: string;
}

@mobx
class Translate extends Component<Props> {
    render(): ReactNode {
        return this.store.localeStore.t(this.props.tKey);
    }
}

export default Translate;
