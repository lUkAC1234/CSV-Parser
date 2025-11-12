import RootStore from "stores/RootStore";

export async function loadTranslation(lang: string, rootStore: RootStore) {
    const { loadingStore } = rootStore;

    loadingStore.setLoaded(false);
    loadingStore.setLoading(true);

    const promise = await import(`../i18n/resources/${lang}.json`);

    loadingStore.setLoaded(true);
    loadingStore.setLoading(false);
    return promise;
}
