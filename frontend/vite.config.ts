import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "url";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const env = loadEnv(process.env.VITE_MODE || "development", process.cwd(), "VITE_");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "src");

function regexChecker(regex: RegExp, fileName: string): boolean {
    return regex.test(fileName);
}

class MissingEnvError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MissingEnvError";
    }
}

function requireEnv(name: string) {
    const value = env[name];
    if (!value) {
        const error = new MissingEnvError(`Missing required environment variable: ${name}`);
        throw error;
    }
    return value;
}

export function convertToWebP() {
    async function processDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await processDir(fullPath);
            } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
                const webpPath = fullPath.replace(/\.(png|jpe?g)$/i, ".webp");
                await sharp(fullPath).webp({ quality: 75 }).toFile(webpPath);

                // Optional: remove original file
                // fs.unlinkSync(fullPath);
            }
        }
    }

    return {
        name: "convert-to-webp",
        closeBundle: async () => {
            const buildDir = path.resolve(__dirname, "build/assets");
            await processDir(buildDir);
        },
    };
}

function checkEnvVars(vars: string[]): void {
    for (const envVarName of vars) requireEnv(envVarName);
    console.table(env);
}

const requiredEnvVars = ["VITE_MODE", "VITE_REACT_DEV_TOOLS", "VITE_DEFAULT_LANG", "VITE_API_ORIGIN"];

checkEnvVars(requiredEnvVars);

export default defineConfig({
    appType: "spa",
    define: {
        VITE_MODE: JSON.stringify(env.VITE_MODE),
        VITE_REACT_DEV_TOOLS: JSON.stringify(env.VITE_REACT_DEV_TOOLS),
    },
    mode: env.VITE_MODE,
    plugins: [
        react({
            tsDecorators: true,
        }),
        ViteImageOptimizer({
            png: { quality: 70 },
            jpg: { quality: 70 },
        }),
        convertToWebP(),
    ],
    resolve: {
        alias: {
            src: path.resolve(root, "src"),
            assets: path.resolve(root, "assets"),
            components: path.resolve(root, "components"),
            decorators: path.resolve(root, "decorators"),
            app: path.resolve(root, "app"),
            HOCs: path.resolve(root, "HOCs"),
            i18n: path.resolve(root, "i18n"),
            stores: path.resolve(root, "stores"),
            types: path.resolve(root, "types"),
            utils: path.resolve(root, "utils"),
        },
    },
    preview: {
        port: 5174,
    },
    build: {
        target: "esnext",
        outDir: "build",
        minify: "esbuild",
        rollupOptions: {
            output: {
                entryFileNames: "js/[name].[hash].js",
                chunkFileNames: "js/[hash].js",
                assetFileNames(chunkInfo: any) {
                    const chunkInfoNames = chunkInfo.names;

                    if (chunkInfoNames) {
                        for (let i = 0; i < chunkInfoNames.length; ++i) {
                            const chunkInfoName = chunkInfoNames[i];
                            if (regexChecker(/\.(css)$/, chunkInfoName)) return "css/[hash].[ext]";
                            if (regexChecker(/\.(webp|jpg|jpeg|png|avif)/, chunkInfoName))
                                return "assets/images/webp/[hash].[ext]";
                            if (regexChecker(/\.(svg)$/, chunkInfoName)) return "assets/images/svg/[hash].[ext]";
                            if (regexChecker(/\.(gif)$/, chunkInfoName)) return "assets/images/gif/[hash].[ext]";
                            if (regexChecker(/\.(woff|woff2)$/, chunkInfoName)) return "assets/fonts/[hash].[ext]";
                            if (regexChecker(/\.(mp4)$/, chunkInfoName)) return "assets/videos/[hash].[ext]";
                        }
                    }

                    return "assets/[hash].[ext]";
                },
            },
        },
    },
});
