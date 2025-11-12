import { Component, ReactNode } from "react";
import { mobx } from "decorators/MobxStore";
import { className } from "utils/functions/className";

import "./InternetState.scss";
import SVG_WifiStable from "components/SVG/SVG_WifiStable";
import SVG_WifiSlash from "components/SVG/SVG_WifiSlash";
import Alert from "components/Alert/Alert";

@mobx
class InternetState extends Component {
    get computedOnlineStateClassName(): string {
        return className("internet-state", {
            "internet-state--active": !this.store.connectionStore.isOnline,
        });
    }

    get svgContainerClass(): string {
        return className("svg-container", {
            "svg-container--no-wifi": !this.store.connectionStore.isOnline,
            "svg-container--wifi": this.store.connectionStore.isOnline,
        });
    }

    render(): ReactNode {
        const { isOnline } = this.store.connectionStore;
        const { t } = this.store.localeStore;
        const message: string = `${t("no-internet")}!`;
        return (
            <div className={this.computedOnlineStateClassName}>
                <div className={this.svgContainerClass}>
                    <SVG_WifiStable id="wifi" />
                    <SVG_WifiSlash id="no-wifi" />
                </div>
                <Alert isOpen={!isOnline} message={message} textAlign="center" />
            </div>
        );
    }
}

export default InternetState;
