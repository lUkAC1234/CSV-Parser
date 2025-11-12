export const disableReactDevTools = () => {
    if ("__REACT_DEVTOOLS_GLOBAL_HOOK__" in window && typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === "object") {
        for (const prop in window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            if (
                "__REACT_DEVTOOLS_GLOBAL_HOOK__" in window &&
                typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__[prop] === "function"
            ) {
                window.__REACT_DEVTOOLS_GLOBAL_HOOK__[prop] = () => {};
            }
        }
    }
};
