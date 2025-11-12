import { action, flow, makeObservable, observable, reaction } from "mobx";
import { loadTranslation } from "i18n/i18nLoader";
import { bound } from "decorators/Bound";
import { BeforeUnload } from "utils/classes/BeforeUnload";
import RootStore from "./RootStore";
import loadings from "i18n/loadings.json";
import MobxStore from "./Abstracts";
import { Log } from "utils/functions/logger";

const env = import.meta.env;
const DEFAULT_LANG: string = env.VITE_DEFAULT_LANG;
export const SUPPORTED_LANGS = ["ru", "uz", "en"];

export type T_Func = (path: string, vars?: Record<string, string>) => string;

export const indexOfLangPath = (): number => {
    const splittedPathList = location.pathname.split("/");
    return splittedPathList.findIndex((lng) => SUPPORTED_LANGS.includes(lng));
};

export const getLanguageFromPath = (): string | null => {
    const parts = location.pathname.split("/");
    const index = indexOfLangPath();
    const langFromPath = parts[index];

    if (index !== -1) {
        return langFromPath;
    }

    return DEFAULT_LANG;
};

class LocaleStore extends MobxStore {
    langs: string[] = SUPPORTED_LANGS;
    @observable langLoaded: number = 0;
    @observable lang: string = getLanguageFromPath();
    @observable translations = observable.map<string, Readonly<Record<string, string>>>();

    constructor(rootStore: RootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @bound
    init(): void {
        reaction(
            () => this.lang,
            (newLang, prevLang) => {
                this.updatePathname(newLang, prevLang);
                this.loadTranslation(newLang);
            },
            { fireImmediately: true },
        );

        const onRouteChange = (): void => {
            const lang: string = getLanguageFromPath();
            this.setLocale(lang);
        };

        window.addEventListener("route-change", onRouteChange);
        BeforeUnload.addHandler(() => {
            window.removeEventListener("route-change", onRouteChange);
        });
    }

    @action.bound
    setLocale(lang: string): void {
        if (lang === null || lang === undefined) return;
        this.lang = lang;
    }

    @action.bound
    setTranslation(lang: string, translation: Record<string, string>): void {
        this.translations.set(lang, translation);
    }

    @flow.bound
    *loadTranslation(lang: string): Generator<Promise<void>, void, any> {
        try {
            const data = yield loadTranslation(lang, this.rootStore);
            if (!this.translations.has(lang)) {
                this.setTranslation(lang, data.default || data);
                this.langLoaded++;
            }
        } catch (err) {
            Log.APIError(`Couldn't load ${lang}.json translation`, err);
        }
    }

    @bound
    t(path: string, vars?: Record<string, string>): string {
        const localeData = this.translations.get(this.lang);
        const fallbackData = this.translations.get(DEFAULT_LANG);
        const value = this.resolvePath(localeData ?? {}, path) ?? this.resolvePath(fallbackData ?? {}, path);

        if (typeof value !== "string") return loadings[this.lang] ?? loadings[DEFAULT_LANG] ?? loadings.ru;
        return vars ? this.interpolate(value, vars) : value;
    }

    private resolvePath(obj: Record<string, any>, path: string) {
        return path.split(".").reduce((acc, part) => acc?.[part], obj);
    }

    private interpolate(template: string, vars: Record<string, string>) {
        return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
    }

    private updatePathname(newLang: string, prevLang: string): void {
        const parts = location.pathname.split("/");
        if (newLang === prevLang) {
            return;
        }
        parts[1] = newLang;
        history.pushState(null, "", parts.join("/"));
    }
}

export default LocaleStore;
