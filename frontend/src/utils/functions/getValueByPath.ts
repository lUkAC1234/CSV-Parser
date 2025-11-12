export function getValueByPath(obj: any, path: string | string[]): any {
    if (typeof path === "string") {
        return path.split(".").reduce((acc, part) => acc?.[part], obj);
    } else if (Array.isArray(path)) {
        return path.reduce((acc, part) => acc?.[part], obj);
    }
}
