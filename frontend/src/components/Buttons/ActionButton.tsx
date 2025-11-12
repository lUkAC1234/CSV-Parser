import { ButtonHTMLAttributes, Component, PureComponent, ReactNode, RefObject, createRef } from "react";
import { To } from "react-router-dom";
import { className } from "utils/functions/className";
import { mobx } from "decorators/MobxStore";

import styles from "./ActionButton.module.scss";
import NavigationLink from "components/Link/NavigationLink";
import OptimizedMedia from "../Media/OptimizedMedia";
import TelegramIcon from "assets/images/svg/telegram.svg";
import WhatsappIcon from "assets/images/svg/whatsapp.svg";
import InstagramIcon from "assets/images/svg/instagram.svg";
import PhoneIcon from "assets/images/svg/phone-call.svg";

type SocialAction = "telegram" | "instagram" | "whatsapp" | "call";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: ReactNode;
    fullwidth?: boolean;
    active?: boolean;
    white?: boolean;
    extra?: boolean;
    bgColor?: string;
    small?: boolean;
    asLink?: { to?: To };
    btnRef?: RefObject<HTMLButtonElement | null>;
    linkRef?: RefObject<HTMLAnchorElement | null>;
    socialMedia?: boolean;
    telegramUrl?: string;
    instagramUrl?: string;
    whatsAppUrl?: string;
    phone?: string;
    wrapperClassName?: string;
}

interface State {
    showSocialMenu: boolean;
}

@mobx
class SelectSocType extends Component {
    render(): ReactNode {
        return (
            <span className={styles["social-menu__info-text"]}>
                {this.store.localeStore.t("action-button.social-media.select-label")}
            </span>
        );
    }
}

@mobx
class SelectLabel extends Component<{
    text: string;
}> {
    render(): ReactNode {
        const { text } = this.props;
        return text === "Позвонить" ? this.store.localeStore.t("action-button.social-media.call") : text;
    }
}

class ActionButton extends PureComponent<Props, State> {
    state: State = { showSocialMenu: false };
    internalBtnRef = createRef<HTMLButtonElement>();
    menuRef = createRef<HTMLDivElement>();
    wrapperRef = createRef<HTMLDivElement>();

    private static readonly SOCIALS = [
        { k: "telegram", l: "Telegram", a: "telegram", i: TelegramIcon },
        { k: "instagram", l: "Instagram", a: "instagram", i: InstagramIcon },
        { k: "whatsapp", l: "WhatsApp", a: "whatsapp", i: WhatsappIcon },
        { k: "call", l: "Позвонить", a: "call", i: PhoneIcon },
    ] as const;

    get actionBtnClassName(): string {
        const { fullwidth, active, white, extra, className: cn } = this.props;
        const mods: Record<string, boolean> = {
            [styles["action-button--full-width"]]: !!fullwidth,
            [styles["action-button--active"]]: !!active,
            [styles["action-button--white"]]: !!white,
            [styles["action-button--extra"]]: !!extra,
        };
        if (cn) mods[cn] = true;
        return className(styles["action-button"], mods);
    }

    private isMobile = () =>
        typeof navigator !== "undefined" &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    private lastPath = (s?: string) => {
        if (!s) return "";
        try {
            const p = new URL(s, "https://example.com").pathname;
            return p.split("/").filter(Boolean).pop() || "";
        } catch {
            return s.split("/").filter(Boolean).pop() || "";
        }
    };

    private openCenteredPopup = (url: string, w = 600, h = 720) => {
        try {
            const left = Math.max(0, Math.round((window.innerWidth - w) / 2));
            const top = Math.max(0, Math.round((window.innerHeight - h) / 2));
            window.open(url, "_blank", `width=${w},height=${h},top=${top},left=${left},resizable,scrollbars`);
        } catch {
            window.open(url, "_blank");
        }
    };

    private openAppOrFallback = (appUrl?: string, webUrl?: string) => {
        if (!this.isMobile() || !appUrl) {
            if (webUrl) this.openCenteredPopup(webUrl, 900, 800);
            return;
        }
        let becameHidden = false;
        const onVis = () => (becameHidden = true);
        document.addEventListener("visibilitychange", onVis, { once: true });
        try {
            window.location.href = appUrl;
        } catch {}
        const t = window.setTimeout(() => {
            document.removeEventListener("visibilitychange", onVis as EventListener);
            if (!becameHidden && webUrl) window.location.href = webUrl;
            clearTimeout(t);
        }, 1200);
    };

    private defaults = (phone: string) => ({
        telegram: this.props.telegramUrl ?? "https://t.me/lUkACENkO1",
        instagram: this.props.instagramUrl ?? "https://instagram.com/enzora.uz",
        whatsapp: this.props.whatsAppUrl ?? `https://wa.me/${phone.replace(/\D/g, "")}`,
    });

    private buildAppUrl(action: SocialAction, provided: Record<string, string | undefined>, phone: string) {
        if (action === "telegram") {
            const p = provided.telegram ?? this.defaults(phone).telegram;
            if (p.startsWith("tg://")) return p;
            const u = this.lastPath(p);
            return u ? `tg://resolve?domain=${u}` : undefined;
        }
        if (action === "instagram") {
            const p = provided.instagram ?? this.defaults(phone).instagram;
            if (p.startsWith("instagram://")) return p;
            const u = this.lastPath(p);
            return u ? `instagram://user?username=${u}` : undefined;
        }
        if (action === "whatsapp") {
            const p = provided.whatsapp ?? this.defaults(phone).whatsapp;
            if (p.startsWith("whatsapp://")) return p;
            const num = (phone.replace(/\D/g, "") || this.lastPath(p)).replace(/\D/g, "");
            return num ? `whatsapp://send?phone=${num}` : undefined;
        }
        return undefined;
    }

    toggleMenu = (show: boolean) => {
        if (show === this.state.showSocialMenu) return;
        this.setState({ showSocialMenu: show }, () => {
            const method = show ? "addEventListener" : "removeEventListener";
            (document as any)[method]("click", this.onDocClick);
            (document as any)[method]("keydown", this.onKeyDown);
        });
    };

    showMenu = () => this.toggleMenu(true);
    hideMenu = () => this.toggleMenu(false);

    onDocClick = (e: MouseEvent) => {
        const t = e.target as Node;
        if (this.menuRef.current?.contains(t) || this.wrapperRef.current?.contains(t)) return;
        this.hideMenu();
    };

    onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") this.hideMenu();
    };

    handleSocialAction = (action: SocialAction) => {
        const phone = this.props.phone ?? "+998331701706";
        const defs = this.defaults(phone);
        const provided = {
            telegram: this.props.telegramUrl,
            instagram: this.props.instagramUrl,
            whatsapp: this.props.whatsAppUrl,
        } as Record<string, string | undefined>;
        this.hideMenu();
        if (action === "call") {
            window.location.href = `tel:${phone}`;
            return;
        }
        const webUrl = provided[action] || (defs as any)[action];
        const appUrl = this.buildAppUrl(action, provided, phone);
        this.openAppOrFallback(appUrl, webUrl);
    };

    combinedClick = (e: React.MouseEvent, original?: (e: any) => void) => {
        if (this.props.socialMedia) e.preventDefault();
        try {
            typeof original === "function" && original(e);
        } catch {}
        if (!this.props.socialMedia) return;
        this.state.showSocialMenu ? this.hideMenu() : this.showMenu();
    };

    renderElement(
        commonProps: any,
        asLink?: { to?: To },
        linkRef?: RefObject<HTMLAnchorElement | null>,
        btnRef?: RefObject<HTMLButtonElement | null>,
        children?: ReactNode,
        type?: any,
    ) {
        const isExternal = typeof asLink?.to === "string" && /^https?:\/\//.test(asLink?.to as string);
        if (asLink?.to) {
            if (isExternal)
                return (
                    <a
                        href={asLink.to as string}
                        ref={linkRef ?? undefined}
                        {...commonProps}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {children}
                    </a>
                );
            return (
                <NavigationLink to={asLink.to} refObject={linkRef} {...commonProps}>
                    {children}
                </NavigationLink>
            );
        }
        return (
            <button {...commonProps} type={type ?? "button"} ref={btnRef ?? this.internalBtnRef}>
                {children}
            </button>
        );
    }

    renderSocialMenu() {
        if (!this.props.socialMedia) return null;
        return (
            <div
                ref={this.menuRef}
                className={className(styles["social-menu"], { [styles["visible"]]: this.state.showSocialMenu })}
                role="menu"
                aria-label="social menu"
            >
                <SelectSocType />
                <div className={styles["social-menu-wrapper"]}>
                    {ActionButton.SOCIALS.map((it) => (
                        <button
                            key={it.k}
                            className={styles["social-menu__item"]}
                            onClick={() => this.handleSocialAction(it.a as SocialAction)}
                            role="menuitem"
                        >
                            <OptimizedMedia
                                src={it.i}
                                alt={`Social media ${String(it.l).toLowerCase()}`}
                                no_image_height
                                className={styles["social-media-icon-wrapper"]}
                                imageClassname={styles["social-media-icon"]}
                            />
                            <SelectLabel text={it.l} />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    render(): ReactNode {
        const {
            socialMedia,
            btnRef,
            linkRef,
            asLink,
            className: _cn,
            wrapperClassName,
            children,
            type,
            ...restProps
        } = this.props;
        const { onClick: originalOnClick, ...rest } = restProps as any;
        const { fullwidth, active, white, black, extra, large, small, ...restFiltered } = rest;
        const commonProps: any = {
            ...restFiltered,
            onClick: (e: any) => this.combinedClick(e, originalOnClick),
            className: this.actionBtnClassName,
            "aria-disabled": rest.disabled ?? undefined,
        };
        const element = this.renderElement(commonProps, asLink, linkRef, btnRef, children, type);
        if (!socialMedia) return element;
        return (
            <div ref={this.wrapperRef} className={`${wrapperClassName} ${styles["action-button__wrapper"]}`}>
                {element}
                {this.renderSocialMenu()}
            </div>
        );
    }
}

export default ActionButton;
