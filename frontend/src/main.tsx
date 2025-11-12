import "assets/styles/style.scss";
import "stores/index";
import App from "./App";
import { HistoryModulePlugin } from "utils/classes/HistoryModule";
import { ReactApp } from "utils/classes/ReactApp";

type Mode = "production" | "development";

const env = import.meta.env;
const MODE: Mode = env.VITE_MODE as Mode;
const appNode: HTMLElement | null = document.getElementById("app");

if (MODE === "development") {
    console.warn("Application runs in development mode...");
    console.warn("StrictMode is turned on! React renders twice");
} else {
    import("utils/functions/dev-tools-blocker");
}

const app = new ReactApp(appNode!);

app.use(HistoryModulePlugin).render(<App />, MODE === "development");
