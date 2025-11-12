import { SUPPORTED_LANGS } from "stores/Locale";

export function withoutLangPathname(): string {
    const splittedPathname: string[] = location.pathname.split("/");
    const langIndex: number = splittedPathname.findIndex((lng) => SUPPORTED_LANGS.includes(lng));
    let finalPathname: string = "";

    for (let i = 0; i < splittedPathname.length; ++i) {
        const path = splittedPathname[i];
        if (i > langIndex) {
            finalPathname += `/${path}`;
        }
    }

    if (finalPathname === "") {
        return "/";
    }

    return finalPathname;
}
