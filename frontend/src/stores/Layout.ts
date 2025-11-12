import { action, observable } from "mobx";
import MobxStore from "./Abstracts";

class Layout extends MobxStore {
    @observable headerIsVisible: boolean = true;
    @observable footerIsVisible: boolean = true;

    @action.bound
    toggleHeaderState(isVisible?: boolean): void {
        if (isVisible === this.headerIsVisible) return;
        this.headerIsVisible = isVisible ?? !this.headerIsVisible;
    }

    @action.bound
    toggleFooterState(isVisible?: boolean): void {
        if (isVisible === this.footerIsVisible) return;
        this.footerIsVisible = isVisible ?? !this.footerIsVisible;
    }
}

export default Layout;
