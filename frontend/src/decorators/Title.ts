import { IReactionDisposer, reaction } from "mobx";
import { Component } from "react";
import { mobx } from "./MobxStore";
import { setComponentName } from "utils/functions/setComponentName";

/** Uses `@mobx` decorator underhood for reactivity purposes, don't use `@mobx` decorator with this decorator, it will through errors! */
export function title<T extends { new (...args: any[]): Component }>(
    optionsFn: (self: InstanceType<T>) => {
        title: string | { key: string };
        locales?: Record<string, string>;
        localeIndexes?: Record<string, string>;
        useLocaleIndexes?: boolean;
    },
) {
    return function (Target: T) {
        @mobx
        class Title extends Target {
            disposeReaction: IReactionDisposer;

            getOptionsTitle(title: string | { key: string }): string {
                return typeof title === "string" ? title : this.store.localeStore.t(title.key);
            }

            componentDidMount(): void {
                this.disposeReaction = reaction(
                    () => [this.store.localeStore.lang, this.store.localeStore.langLoaded],
                    ([lang]) => {
                        const options = optionsFn(this as InstanceType<T>);
                        if (options.useLocaleIndexes) {
                            const hasLocaleIndex: boolean = Boolean(options?.localeIndexes?.[lang]);
                            document.title = hasLocaleIndex
                                ? this.store.localeStore.t(options?.localeIndexes?.[lang])
                                : this.getOptionsTitle(options.title);
                        } else {
                            document.title =
                                options?.locales?.[lang] ??
                                this.getOptionsTitle(options.title) ??
                                this.store.localeStore.t("loading");
                        }
                    },
                    { fireImmediately: true },
                );
                super.componentDidMount?.();
            }

            componentWillUnmount(): void {
                this.disposeReaction?.();
                super.componentWillUnmount?.();
            }
        }

        setComponentName(Title, Target, "Title");
        return Title;
    };
}
