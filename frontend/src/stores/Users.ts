import { makeObservable, observable, runInAction } from "mobx";
import { UsersModel } from "types/users";
import { bound } from "decorators/Bound";
import MobxStore from "./Abstracts";
import RootStore from "./RootStore";
import FetchStore from "./Fetch";

const TOKEN_KEY = "auth_token";

function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^|;)\\s*" + name.replace(/[-.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
    if (typeof document === "undefined") return;
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax${secure}`;
}

function removeCookie(name: string) {
    if (typeof document === "undefined") return;
    const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${secure}`;
}

class UsersStore extends MobxStore {
    fetcher: FetchStore<UsersModel>;
    @observable user: null | { username: string } = null;
    @observable token: string | null = null;
    @observable loading = false;
    @observable error: string | null = null;

    constructor(rootStore: RootStore) {
        super(rootStore);

        this.fetcher = new FetchStore(null, {
            delay: 50,
            loadingByDefault: true,
        });

        makeObservable(this);
        const stored = getCookie(TOKEN_KEY);
        if (stored) {
            this.token = stored;
            void this.fetchMe();
        }
    }

    getAuthHeader(): Record<string, string> {
        if (!this.token) return {};
        return { Authorization: `Token ${this.token}` };
    }

    @bound
    async login(username: string, password: string) {
        this.loading = true;
        this.error = null;
        try {
            const url = `${this.rootStore.apiStore.origin}/api/auth/login/`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                runInAction(() => {
                    this.error = data?.detail || "Ошибка входа";
                    this.loading = false;
                });
                return false;
            }
            const token = data?.token ?? null;
            runInAction(() => {
                this.token = token;
                this.user = data?.username ? { username: data.username } : null;
                if (token) {
                    setCookie(TOKEN_KEY, token);
                } else {
                    removeCookie(TOKEN_KEY);
                }
                this.loading = false;
            });
            return true;
        } catch (err: any) {
            runInAction(() => {
                this.error = String(err?.message || err);
                this.loading = false;
            });
            return false;
        }
    }

    @bound
    async logout() {
        if (!this.token) {
            this.clearAuth();
            return;
        }
        try {
            await fetch(`${this.rootStore.apiStore.origin}/api/auth/logout/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
            });
        } catch (_) {}
        this.clearAuth();
    }

    @bound
    clearAuth() {
        this.token = null;
        this.user = null;
        removeCookie(TOKEN_KEY);
    }

    @bound
    async fetchMe() {
        if (!this.token) {
            this.clearAuth();
            return;
        }
        this.loading = true;
        try {
            const res = await fetch(`${this.rootStore.apiStore.origin}/api/auth/me/`, {
                method: "GET",
                headers: { ...this.getAuthHeader() },
            });
            if (!res.ok) {
                runInAction(() => {
                    this.clearAuth();
                    this.loading = false;
                });
                return;
            }
            const data = await res.json();
            runInAction(() => {
                this.user = { username: data.username };
                this.loading = false;
            });
        } catch (err) {
            runInAction(() => {
                this.clearAuth();
                this.loading = false;
            });
        }
    }

    @bound
    fetchUsers(): void {
        const urlStr = this.rootStore.apiStore.get("/users");
        if (!urlStr) return;
        const url = new URL(urlStr);
        this.fetcher.fetch(url, {
            method: "GET",
            headers: { ...this.getAuthHeader() },
            onSuccess: (_data: any) => {},
            onError: (err: any) => {
                runInAction(() => {
                    this.error = String(err || "Ошибка");
                });
            },
        });
    }
}

export default UsersStore;
