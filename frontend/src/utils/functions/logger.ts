type LogCategory = "UI" | "CQL" | "MobX" | "API" | "Leaflet" | "App" | "Decorator";

const categoryStyles: Record<LogCategory, string> = {
    UI: "background:#3b82f6;color:white;padding:2px 6px;border-radius:4px;", // blue
    CQL: "background:#10b981;color:white;padding:2px 6px;border-radius:4px;", // green
    MobX: "background:#f59e0b;color:white;padding:2px 6px;border-radius:4px;", // amber
    API: "background:#6366f1;color:white;padding:2px 6px;border-radius:4px;", // indigo
    Leaflet: "background:#22d3ee;color:#082f49;padding:2px 6px;border-radius:4px;", // cyan
    App: "background:#71AA0E;color:white;padding:2px 6px;border-radius:4px", // green
    Decorator: "background:orange;color:white;padding:2px 6px;border-radius:4px", // orange
};

const errorStyle = "background:#dc2626;color:white;padding:2px 6px;border-radius:4px;font-weight:bold;";

function timestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false });
}

function log(category: LogCategory, ...args: any[]) {
    console.debug(`%c[${timestamp()}] %c[${category}]`, "color:gray;", categoryStyles[category], ...args);
}

function logError(category: LogCategory, ...args: any[]) {
    console.error(`%c[${timestamp()}] %c[${category} ERROR]`, "color:gray;", errorStyle, ...args);
}

export const Log = {
    UI: (...args: any[]) => log("UI", ...args),
    CQL: (...args: any[]) => log("CQL", ...args),
    MobX: (...args: any[]) => log("MobX", ...args),
    API: (...args: any[]) => log("API", ...args),
    Leaflet: (...args: any[]) => log("Leaflet", ...args),
    App: (...args: any[]) => log("App", ...args),
    Decorator: (...args: any[]) => log("Decorator", ...args),

    UIError: (...args: any[]) => logError("UI", ...args),
    CQLError: (...args: any[]) => logError("CQL", ...args),
    MobXError: (...args: any[]) => logError("MobX", ...args),
    APIError: (...args: any[]) => logError("API", ...args),
    LeafletError: (...args: any[]) => logError("Leaflet", ...args),
    AppError: (...args: any[]) => logError("App", ...args),
    DecoratorError: (...args: any[]) => logError("Decorator", ...args),
};
