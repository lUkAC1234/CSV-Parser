import { title } from "decorators/Title";
import React from "react";
import type { ReactNode } from "react";
import styles from "./MainSection.module.scss";
import type { CallRecordModel, CallRecordState } from "types/callrecord";
import { ORIGIN } from "stores/Api";


@title(() => ({
    title: "Home",
}))
class MainSection extends React.PureComponent<CallRecordModel, CallRecordState> {
    constructor(props: CallRecordModel) {
        super(props);
        this.state = {
            calldate: "",
            src: "",
            dst: "",
            duration: "",
            billsec: "",
            submitting: false,
            success: "",
            errors: {},
        };
    }

    getCookie(name: string): string | null {
        const v = `; ${document.cookie}`;
        const parts = v.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()!.split(";").shift() || null;
        return null;
    }

    validate = (): Record<string, string> => {
        const errors: Record<string, string> = {};
        const phoneRe = /^[\d\+\-\s\(\)]{2,50}$/;

        if (!this.state.calldate) errors.calldate = "Дата и время обязательны.";
        if (!this.state.src) errors.src = "Поле «Источник» обязательно.";
        else if (!phoneRe.test(this.state.src)) errors.src = "Неверный формат источника (только цифры, + - пробелы и скобки).";

        if (!this.state.dst) errors.dst = "Поле «Назначение» обязательно.";
        else if (!phoneRe.test(this.state.dst)) errors.dst = "Неверный формат назначения (только цифры, + - пробелы и скобки).";

        if (this.state.duration !== "") {
            const d = Number(this.state.duration);
            if (!Number.isInteger(d) || d < 0) errors.duration = "Длительность должна быть целым числом ≥ 0.";
        }

        if (this.state.billsec !== "") {
            const b = Number(this.state.billsec);
            if (!Number.isInteger(b) || b < 0) errors.billsec = "Billsec должен быть целым числом ≥ 0.";
        }

        return errors;
    };

    handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        this.setState({ [name]: value, errors: {}, success: "" } as Pick<CallRecordState, keyof CallRecordState>);
    };

    normalizeDateLocalToISO(localValue: string): string {
        if (!localValue) return "";
        const dt = new Date(localValue);
        if (Number.isNaN(dt.getTime())) {
            return localValue;
        }
        return dt.toISOString();
    }

    handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = this.validate();
        if (Object.keys(errors).length) {
            this.setState({ errors });
            return;
        }

        this.setState({ submitting: true, errors: {}, success: "" });

        const payload = {
            calldate: this.normalizeDateLocalToISO(this.state.calldate),
            src: (this.state.src || "").trim(),
            dst: (this.state.dst || "").trim(),
            duration: this.state.duration === "" ? 0 : Number(this.state.duration),
            billsec: this.state.billsec === "" ? 0 : Number(this.state.billsec),
        };

        try {
            const csrftoken = this.getCookie("csrftoken");
            const res = await fetch(`${ORIGIN}/api/calls/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => null);

            if (res.ok) {
                this.setState({
                    calldate: "",
                    src: "",
                    dst: "",
                    duration: "",
                    billsec: "",
                    submitting: false,
                    success: "Запись успешно создана.",
                    errors: {},
                });
            } else {
                const formatted: Record<string, string> = {};
                if (data) {
                    if (data.detail) formatted._global = data.detail;
                    else {
                        for (const k in data) {
                            const v = data[k];
                            formatted[k] = Array.isArray(v) ? v[0] : String(v);
                        }
                    }
                } else {
                    formatted._global = "Сервер вернул ошибку.";
                }
                this.setState({ errors: formatted, submitting: false });
            }
        } catch (err: any) {
            this.setState({
                errors: { _global: "Ошибка сети: " + (err?.message || err) },
                submitting: false,
            });
        }
    };

    renderFieldError(field: string) {
        const err = this.state.errors && this.state.errors[field];
        if (!err) return null;
        return <div className={styles.error}>{err}</div>;
    }

    render(): ReactNode {
        const { submitting, success } = this.state;
        return (
            <section>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <h2 className={styles.title}>Создать запись звонка</h2>
                        <hr className={styles["custom-line"]} />
                        <form className={styles.form} onSubmit={this.handleSubmit} noValidate>
                            <div className={styles.row}>
                                <label className={styles.label} htmlFor="calldate">Дата и время</label>
                                <input
                                    id="calldate"
                                    className={styles.input}
                                    type="datetime-local"
                                    name="calldate"
                                    value={this.state.calldate}
                                    onChange={this.handleChange}
                                    placeholder="гггг-мм-дд чч:мм"
                                    required
                                />
                                {this.renderFieldError("calldate")}
                            </div>

                            <div className={styles.row}>
                                <label className={styles.label} htmlFor="src">Источник (src)</label>
                                <input
                                    id="src"
                                    className={styles.input}
                                    name="src"
                                    placeholder="+998 90 123 45 67"
                                    value={this.state.src}
                                    onChange={this.handleChange}
                                    spellCheck={false}
                                    required
                                />
                                {this.renderFieldError("src")}
                            </div>

                            <div className={styles.row}>
                                <label className={styles.label} htmlFor="dst">Назначение (dst)</label>
                                <input
                                    id="dst"
                                    className={styles.input}
                                    name="dst"
                                    placeholder="701"
                                    value={this.state.dst}
                                    onChange={this.handleChange}
                                    spellCheck={false}
                                    required
                                />
                                {this.renderFieldError("dst")}
                            </div>

                            <div className={styles.rowInline}>
                                <div className={styles.col}>
                                    <label className={styles.label} htmlFor="duration">Длительность (сек)</label>
                                    <input
                                        id="duration"
                                        className={styles.input}
                                        name="duration"
                                        type="number"
                                        min="0"
                                        placeholder="60"
                                        value={this.state.duration}
                                        onChange={this.handleChange}
                                    />
                                    {this.renderFieldError("duration")}
                                </div>

                                <div className={styles.col}>
                                    <label className={styles.label} htmlFor="billsec">Billsec (сек)</label>
                                    <input
                                        id="billsec"
                                        className={styles.input}
                                        name="billsec"
                                        type="number"
                                        min="0"
                                        placeholder="55"
                                        value={this.state.billsec}
                                        onChange={this.handleChange}
                                    />
                                    {this.renderFieldError("billsec")}
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <button className={styles.button} type="submit" disabled={submitting}>
                                    {submitting ? "Отправка..." : "Создать"}
                                </button>
                                {success && <div className={styles.success}>{success}</div>}
                                {this.state.errors && this.state.errors._global && (
                                    <div className={styles.error}>{this.state.errors._global}</div>
                                )}
                            </div>
                        </form>

                        <p className={styles.note}>
                            Примечание: поле <strong>disposition</strong> и статус ответа устанавливаются администраторами через админ-панель.
                        </p>
                    </div>
                </div>
            </section>
        );
    }
}

export default MainSection;
