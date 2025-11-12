import RootStore from "stores/RootStore";

declare global {
    interface Window {
        fetchData(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    }
}

export let fetchData = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
        const response = await fetch(input, init);
        return response;
    } catch (error) {
        throw error;
    }
};

window.fetchData = fetchData;

export function setupGlobalFetch(rootStore: RootStore): void {
    const originalFetch = fetchData;

    fetchData = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const { loadingStore } = rootStore;
        loadingStore.setLoading(true);
        loadingStore.setLoaded(false);

        try {
            const response = await originalFetch(input, init);
            return response;
        } catch (error) {
            throw error;
        } finally {
            loadingStore.setLoading(false);
            loadingStore.setLoaded(true);
        }
    };
}
