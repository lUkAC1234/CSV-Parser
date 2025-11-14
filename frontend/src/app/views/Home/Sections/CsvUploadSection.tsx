import React from "react";
import type { ReactNode } from "react";
import styles from "./CsvUploadSection.module.scss";
import { ORIGIN } from "stores/Api";

type ParsedRow = {
    line: number;
    mapped: Record<string, string>;
    errors: string[];
};

type State = {
    fileName: string;
    headers: string[];
    rows: ParsedRow[];
    parsing: boolean;
    parsed: boolean;
    submitting: boolean;
    success: string;
    errors: string[];
};

const REQUIRED_HEADERS = ["calldate", "src", "dst", "duration", "billsec", "disposition"];
const phoneRe = /^[\d\+\-\s\(\)]{2,50}$/;

class CsvUploadSection extends React.PureComponent<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            fileName: "",
            headers: [],
            rows: [],
            parsing: false,
            parsed: false,
            submitting: false,
            success: "",
            errors: [],
        };
    }

    getCookie(name: string): string | null {
        const v = `; ${document.cookie}`;
        const parts = v.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()!.split(";").shift() || null;
        return null;
    }

    parseCSV(text: string): string[][] {
        const rows: string[][] = [];
        let row: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === '"') {
                if (inQuotes && text[i + 1] === '"') {
                    cur += '"';
                    i++;
                    continue;
                }
                inQuotes = !inQuotes;
                continue;
            }
            if (ch === "," && !inQuotes) {
                row.push(cur);
                cur = "";
                continue;
            }
            if ((ch === "\n" || ch === "\r") && !inQuotes) {
                row.push(cur);
                cur = "";
                if (ch === "\r" && text[i + 1] === "\n") i++;
                rows.push(row);
                row = [];
                continue;
            }
            cur += ch;
        }
        if (cur !== "" || row.length) {
            row.push(cur);
            rows.push(row);
        }
        return rows.map((r) => r.map((f) => f.trim()));
    }

    validateHeaders(headers: string[]): { ok: boolean; map: Record<string, number>; reason?: string } {
        const normalized = headers.map((h) => h.trim().toLowerCase());
        const map: Record<string, number> = {};
        normalized.forEach((h, idx) => (map[h] = idx));
        for (const req of REQUIRED_HEADERS) {
            if (!(req in map)) return { ok: false, map, reason: `Отсутствует столбец: ${req}` };
        }
        return { ok: true, map };
    }

    expandScientificNotation(s: string): string {
        const str = String(s).trim();
        if (!/[eE]/.test(str)) return str;
        const m = str.match(/^([+-]?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/);
        if (!m) return str;
        const sign = m[1] === "-" ? "-" : "";
        const intPart = m[2] || "";
        const fracPart = m[3] || "";
        const exp = Number(m[4] || "0");
        const digits = intPart + fracPart;
        const fracLen = fracPart.length;
        if (exp >= fracLen) {
            return sign + digits + "0".repeat(exp - fracLen);
        } else {
            const idx = digits.length - (fracLen - exp);
            return sign + digits.slice(0, idx) + "." + digits.slice(idx);
        }
    }

    normalizePhone(raw: string): string {
        if (raw === null || raw === undefined) return "";
        let v = String(raw).trim();
        if (!v) return "";
        if (/^[\d.+-eE]+$/.test(v) && /[eE]/.test(v)) v = this.expandScientificNotation(v);
        v = v.replace(/^0+(\d+)/, "$1");
        v = v.replace(/\./g, "");
        v = v.replace(/\s+/g, " ");
        return v;
    }

    parseMdyDatetime(s: string): Date | null {
        const m = String(s).trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (!m) return null;
        const month = Number(m[1]);
        const day = Number(m[2]);
        const year = Number(m[3]);
        const hour = Number(m[4]);
        const minute = Number(m[5]);
        const second = m[6] ? Number(m[6]) : 0;
        const dt = new Date(year, month - 1, day, hour, minute, second);
        if (Number.isNaN(dt.getTime())) return null;
        return dt;
    }

    normalizeDateLocalToISO(localValue: string): string {
        if (!localValue) return "";
        let dt = new Date(localValue);
        if (Number.isNaN(dt.getTime())) {
            const alt = this.parseMdyDatetime(localValue);
            dt = alt || new Date(localValue.replace(" ", "T"));
            if (!dt || Number.isNaN(dt.getTime())) return localValue;
        }
        return dt.toISOString();
    }

    normalizeDisposition(v: string): string {
        if (!v) return "OTHER";
        const s = v.trim().toLowerCase().replace(/[_\-]/g, " ");
        if (s === "answered" || s.includes("answered")) return "ANSWERED";
        if (s === "no answer" || s.includes("no answer") || s.includes("noanswer")) return "NO ANSWER";
        return "OTHER";
    }

    validateRow(mapped: Record<string, string>): string[] {
        const errors: string[] = [];
        const cd = mapped["calldate"] || "";
        if (!cd || !String(cd).trim()) {
            errors.push("Дата и время обязательны.");
        } else {
            const dtNative = new Date(cd);
            const dtAlt = this.parseMdyDatetime(cd);
            if (Number.isNaN(dtNative.getTime()) && !dtAlt) errors.push("Неверный формат calldate.");
        }
        const srcRaw = mapped["src"] || "";
        const src = this.normalizePhone(srcRaw);
        if (!src) errors.push("Поле «Источник» обязательно.");
        else if (!phoneRe.test(src)) errors.push("Неверный формат источника (только цифры, + - пробелы и скобки).");
        const dstRaw = mapped["dst"] || "";
        const dst = this.normalizePhone(dstRaw);
        if (!dst) errors.push("Поле «Назначение» обязательно.");
        else if (!phoneRe.test(dst)) errors.push("Неверный формат назначения (только цифры, + - пробелы и скобки).");
        if ((mapped["duration"] ?? "") !== "") {
            const d = Number(String(mapped["duration"]).replace(/\s+/g, ""));
            if (!Number.isInteger(d) || d < 0) errors.push("Длительность должна быть целым числом ≥ 0.");
        } else {
            errors.push("duration пустой");
        }
        if ((mapped["billsec"] ?? "") !== "") {
            const b = Number(String(mapped["billsec"]).replace(/\s+/g, ""));
            if (!Number.isInteger(b) || b < 0) errors.push("Billsec должен быть целым числом ≥ 0.");
        } else {
            errors.push("billsec пустой");
        }
        return errors;
    }

    handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files && e.target.files[0];
        this.setState({ fileName: f ? f.name : "", headers: [], rows: [], parsing: false, parsed: false, success: "", errors: [] });
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = String(ev.target?.result || "");
            this.parseTextAsCsv(text);
        };
        reader.onerror = () => this.setState({ errors: ["Не удалось прочитать файл."] });
        reader.readAsText(f, "utf-8");
    };

    parseTextAsCsv(text: string) {
        this.setState({ parsing: true, rows: [], headers: [], errors: [], parsed: false, success: "" });
        try {
            const rawRows = this.parseCSV(text).filter((r) => !(r.length === 1 && r[0] === ""));
            if (!rawRows.length) {
                this.setState({ parsing: false, errors: ["Файл пустой"] });
                return;
            }
            const headerRow = rawRows[0].map((h) => h.trim());
            headerRow[0] = headerRow[0].replace(/^\uFEFF/, "");
            const headerCheck = this.validateHeaders(headerRow);
            if (!headerCheck.ok) {
                this.setState({ parsing: false, errors: [headerCheck.reason || "Неверные заголовки. Проверьте, что CSV содержит заголовки: calldate, src, dst, duration, billsec, disposition"] });
                return;
            }
            const mapIndices = headerCheck.map;
            const rows: ParsedRow[] = [];
            for (let i = 1; i < rawRows.length; i++) {
                const raw = rawRows[i];
                const mapped: Record<string, string> = {};
                for (const h of Object.keys(mapIndices)) {
                    const idx = mapIndices[h];
                    mapped[h] = raw[idx] !== undefined ? String(raw[idx]).trim() : "";
                }
                const errors = this.validateRow(mapped);
                rows.push({ line: i + 1, mapped, errors });
            }
            this.setState({ parsing: false, parsed: true, rows, headers: headerRow, errors: [] });
        } catch (err: any) {
            this.setState({ parsing: false, errors: [String(err?.message || err)] });
        }
    }

    interpretServerErrors(data: any, status: number): string[] {
        const out: string[] = [];
        if (!data) {
            out.push(`Сервер вернул статус ${status} без тела ответа. Проверьте лог сервера.`);
            return out;
        }
        if (status === 401) {
            out.push("Неавторизован (401). Проверьте токен авторизации.");
            out.push("Проверьте в браузере наличие cookie 'auth_token' и что при запросе отправляется заголовок Authorization: Token <auth_token>.");
            out.push("Если cookie есть, убедитесь что сервер ожидает 'Token ' префикс и что CORS/credentials настроены (fetch должен использовать credentials:'include').");
            out.push("Попробуйте заново войти в систему (logout → login) и повторить загрузку.");
            return out;
        }
        if (status === 403) {
            out.push("Доступ запрещён (403). Токен действителен, но у пользователя нет прав.");
            out.push("Проверьте, что пользователь, под которым вы вошли, имеет необходимые права и что эндпоинт действительно защищён нужной логикой (проверьте настройки permission_classes на сервере).");
            return out;
        }
        if (status === 400) {
            if (Array.isArray(data.errors)) {
                out.push(`Сервер вернул ошибки в ${data.errors.length} строк(е/ах):`);
                for (const e of data.errors) {
                    const line = e.line ?? "?";
                    if (Array.isArray(e.errors)) {
                        out.push(`Строка ${line}: ${e.errors.join("; ")}`);
                        for (const msg of e.errors) {
                            if (msg.toLowerCase().includes("calldate")) out.push(`Строка ${line} — исправить calldate: используйте ISO 8601 (2023-01-31T12:34:56Z) или формат MM/DD/YYYY HH:MM:SS.`);
                            if (msg.toLowerCase().includes("src") || msg.toLowerCase().includes("dst")) out.push(`Строка ${line} — номера src/dst: оставьте только цифры и знаки + - пробелы скобки; длина ≤ 64.`);
                            if (msg.toLowerCase().includes("duration") || msg.toLowerCase().includes("billsec")) out.push(`Строка ${line} — duration/billsec: целое число ≥ 0, без дробной части и пробелов.`);
                            if (msg.toLowerCase().includes("disposition")) out.push(`Строка ${line} — disposition: используйте 'answered', 'no answer' или любую строку; при загрузке возможна нормализация в ANSWERED/NO ANSWER/OTHER.`);
                        }
                    } else {
                        out.push(`Строка ${line}: ${String(e.errors)}`);
                    }
                }
                out.push("После исправления ошибок повторите загрузку. Для локальной проверки откройте CSV и проверьте проблемные строки по номерам.");
                return out;
            }
            if (data.detail) {
                out.push(`Сервер: ${String(data.detail)}`);
                if (String(data.detail).toLowerCase().includes("records должен")) out.push("Проверьте, что вы отправляете JSON с ключом records: [{...}, {...}]");
                return out;
            }
        }
        if (status >= 500) {
            out.push(`Ошибка сервера (${status}). Попробуйте позже и проверьте логи сервера.`);
            if (data.detail) out.push(String(data.detail));
            return out;
        }
        if (data.errors || data.detail) {
            if (data.errors) out.push(JSON.stringify(data.errors));
            if (data.detail) out.push(String(data.detail));
            return out;
        }
        out.push("Не удалось распарсить ответ сервера.");
        return out;
    }

    handleSend = async () => {
        const { rows } = this.state;
        const rowsWithErrors = rows.filter((r) => r.errors.length);
        if (rowsWithErrors.length) {
            this.setState({ errors: [`Есть ${rowsWithErrors.length} строк(и) с ошибками. Исправьте их перед отправкой.`] });
            return;
        }
        if (!rows.length) {
            this.setState({ errors: ["Нет строк для отправки"] });
            return;
        }
        this.setState({ submitting: true, errors: [], success: "" });
        const payload = rows.map((r) => {
            const m = r.mapped;
            return {
                calldate: this.normalizeDateLocalToISO(m["calldate"] || ""),
                src: this.normalizePhone(m["src"] || ""),
                dst: this.normalizePhone(m["dst"] || ""),
                duration: m["duration"] === "" ? 0 : Number(String(m["duration"]).replace(/\s+/g, "")),
                billsec: m["billsec"] === "" ? 0 : Number(String(m["billsec"]).replace(/\s+/g, "")),
                disposition: this.normalizeDisposition(m["disposition"] || ""),
            };
        });
        try {
            const csrftoken = this.getCookie("csrftoken");
            const authToken = this.getCookie("auth_token");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (csrftoken) headers["X-CSRFToken"] = csrftoken;
            if (authToken) headers["Authorization"] = `Token ${authToken}`;
            const res = await fetch(`${ORIGIN}/api/calls/bulk_create/`, {
                method: "POST",
                headers,
                credentials: "include",
                body: JSON.stringify({ records: payload }),
            });
            const data = await res.json().catch(() => null);
            if (res.ok) {
                const created = typeof data?.created === "number" ? data.created : payload.length;
                this.setState({ submitting: false, success: `Успех — создано ${created} записей`, rows: [], headers: [], fileName: "", parsed: false, errors: [] });
            } else {
                const details = this.interpretServerErrors(data, res.status);
                this.setState({ submitting: false, errors: details, success: "" });
            }
        } catch (err: any) {
            const netMsg = String(err?.message || err);
            const suggestions = [
                `Ошибка сети: ${netMsg}`,
                "Проверьте подключение к интернету и доступность сервера.",
                "Проверьте в DevTools запрос: URL, Request headers, Request payload и Response body.",
            ];
            this.setState({ submitting: false, errors: suggestions, success: "" });
        }
    };

    renderRowPreview(row: ParsedRow, idx: number): ReactNode {
        const preview = [
            row.mapped["calldate"] ?? "",
            this.normalizePhone(row.mapped["src"] ?? ""),
            this.normalizePhone(row.mapped["dst"] ?? ""),
            row.mapped["duration"] ?? "",
            row.mapped["billsec"] ?? "",
            row.mapped["disposition"] ?? "",
        ].join(" · ");
        return (
            <tr key={idx} className={row.errors.length ? styles.rowError : ""}>
                <td className={styles.cellLine}>{row.line}</td>
                <td className={styles.cellPreview}>{preview}</td>
                <td className={styles.cellErrors}>
                    {row.errors.length ? row.errors.map((e, i) => <div key={i}>{e}</div>) : <span className={styles.ok}>OK</span>}
                </td>
            </tr>
        );
    }

    render(): ReactNode {
        const { fileName, parsing, parsed, rows, submitting, success, errors } = this.state;
        const goodCount = rows.filter((r) => !r.errors.length).length;
        const badCount = rows.length - goodCount;
        const previewRows = badCount > 0 ? rows.filter((r) => r.errors.length) : rows.slice(0, 5);
        return (
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <h3 className={styles.title}>Загрузить CSV с записями</h3>
                            <div className={styles.total}>{rows.length ? `Всего строк: ${rows.length}` : ""}</div>
                        </div>

                        <div className={styles.uploadRow}>
                            <label className={styles.fileLabel}>
                                <input id="csvfile" type="file" accept=".csv,text/csv" onChange={this.handleFileChange} className={styles.fileInput} />
                                <span className={styles.fileBtn}>{fileName || "Выберите CSV"}</span>
                            </label>
                            <div className={styles.meta}>
                                {parsing && <div className={styles.metaText}>Парсинг…</div>}
                                {!parsing && parsed && <div className={styles.metaTextSmall}>Готово к отправке: {goodCount} / {rows.length}</div>}
                            </div>
                        </div>

                        {success && <div className={styles.success} role="status">{success}</div>}

                        {errors.length > 0 && <div className={styles.errorList}>{errors.map((e, i) => <div key={i} className={styles.error}>{e}</div>)}</div>}

                        {parsed && (
                            <>
                                <div className={styles.summary}>
                                    <div className={styles.bad}>Ошибки: {badCount}</div>
                                    <div className={styles.good}>Готово: {goodCount}</div>
                                </div>

                                <div className={styles.preview}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th className={styles.th}>#</th>
                                                <th className={styles.th}>Превью</th>
                                                <th className={styles.th}>Ошибки / Статус</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.map((r, i) => this.renderRowPreview(r, i))}
                                        </tbody>
                                    </table>
                                    <div className={styles.previewNote}>
                                        {badCount > 0 ? `Показаны строки с ошибками: ${badCount}` : `Показаны первые 5 строк · Всего: ${rows.length}`}
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button className={styles.button} onClick={this.handleSend} disabled={submitting || badCount > 0 || goodCount === 0}>
                                        {submitting ? "Отправка…" : `Отправить ${goodCount}`}
                                    </button>
                                </div>
                            </>
                        )}

                        <div className={styles.footer}>
                            <div className={styles.note}>Формат: calldate,src,dst,duration,billsec,disposition</div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}

export default CsvUploadSection;