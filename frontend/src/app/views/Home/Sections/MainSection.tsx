import { title } from "decorators/Title";
import { Component, ReactNode } from "react";
import styles from "./MainSection.module.scss";
import Container from "components/Container/PaddingContainer";

@title(() => ({
    title: "Home",
}))
class MainSection extends Component {
    state = {
        username: "",
        password: "",
        submitting: false,
        errors: [] as string[],
        success: "",
    };

    componentDidMount(): void {
        try {
            this.store.usersStore?.fetchMe();
        } catch {
        }
    }

    handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        this.setState({ [name]: value, errors: [], success: "" });
    };

    handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const { username, password } = this.state as any;
        if (!username || !password) {
            this.setState({ errors: ["Введите имя пользователя и пароль"] });
            return;
        }
        this.setState({ submitting: true, errors: [], success: "" });
        try {
            const ok = await this.store.usersStore.login(String(username), String(password));
            if (ok) {
                this.setState({ submitting: false, success: "Успешно авторизованы", password: "" });
            } else {
                this.setState({ submitting: false, errors: [this.store.usersStore.error || "Ошибка входа"] });
            }
        } catch (err: any) {
            this.setState({ submitting: false, errors: [String(err?.message || err)] });
        }
    };

    handleLogout = async () => {
        try {
            await this.store.usersStore.logout();
            this.setState({ success: "Вы вышли", errors: [], username: "", password: "" });
        } catch {
            this.setState({ errors: ["Ошибка при выходе"] });
        }
    };

    render(): ReactNode {
        const usersStore = this.store.usersStore;
        const loggedUser = usersStore?.user ?? null;
        const { username, password, submitting, errors, success } = this.state as any;

        return (
            <Container as="section" className={styles.section}>
                <div className={styles.wrapper}>
                    <h1 className={styles.title}>Войти</h1>
                    {!loggedUser ? (
                        <form className={styles.authForm} onSubmit={this.handleLogin} noValidate>
                            <label className={styles.label}>
                                Имя пользователя
                                <input
                                    name="username"
                                    value={username}
                                    onChange={this.handleChange}
                                    className={styles.input}
                                    autoComplete="username"
                                    placeholder="admin"
                                />
                            </label>

                            <label className={styles.label}>
                                Пароль
                                <input
                                    name="password"
                                    value={password}
                                    onChange={this.handleChange}
                                    type="password"
                                    className={styles.input}
                                    autoComplete="current-password"
                                    placeholder="******"
                                />
                            </label>

                            <div className={styles.actions}>
                                <button className={styles.button} type="submit" disabled={submitting}>
                                    {submitting ? "Вход..." : "Войти"}
                                </button>
                                {success && <div className={styles.success}>{success}</div>}
                                {errors && errors.length > 0 && (
                                    <div className={styles.error}>
                                        {errors.map((e: string, i: number) => (
                                            <div key={i}>{e}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className={styles.authBox}>
                            <p>
                                Вы вошли как <strong>{loggedUser.username}</strong>
                            </p>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button className={styles.button} onClick={this.handleLogout}>
                                    Выйти
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Container>
        );
    }
}

export default MainSection;
