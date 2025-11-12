import styles from "./LogoLoader.module.scss";
import { CSSProperties, PureComponent, ReactNode } from "react";

interface Props {
    fullsizeCentered?: boolean;
    centerFixed?: boolean;
    style?: CSSProperties;
}

const letters = [
    { char: "E", gradient: "g1", className: "dash" },
    { char: "N", gradient: "g1", className: "dash" },
    { char: "Z", gradient: "g1", className: "dash" },
    { char: "O", gradient: "g1", className: "dash" },
    { char: "R", gradient: "g1", className: "dash" },
    { char: "A", gradient: "g1", className: "dash" },
];

const Gradients = () => (
    <svg height="0" width="0" viewBox="0 0 64 64" className={styles["absolute"]}>
        <defs xmlns="http://www.w3.org/2000/svg">
            <linearGradient id="g1" x1="0" y1="62" x2="0" y2="2" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--white)" />
                <stop stopColor="var(--white)" offset="1" />
            </linearGradient>
        </defs>
    </svg>
);

const Letter = ({ char, gradient, className }: { char: string; gradient: string; className: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        height="64"
        width="64"
        className={styles["inline-block"]}
    >
        <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontWeight="800"
            fontSize="44"
            fill="none"
            stroke={`url(#${gradient})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles[className]}
            pathLength={360}
        >
            {char}
        </text>
    </svg>
);

class LogoLoader extends PureComponent<Props> {
    renderLetters(): ReactNode {
        return letters.map(({ char, gradient, className }) => (
            <Letter key={char} char={char} gradient={gradient} className={className} />
        ));
    }

    render(): ReactNode {
        const { fullsizeCentered, centerFixed, style } = this.props;

        const wrapperClass = fullsizeCentered
            ? styles["logo-loader__fullsize-centered-wrapper"]
            : centerFixed
              ? styles["logo-loader__center-fixed-wrapper"]
              : "";

        return (
            <div className={`${wrapperClass} ${styles["logo-loader-wrapper-for-all"]}`} style={style}>
                <div className={styles["logo-loader"]} role="img" aria-label="Loading ENZORA">
                    <Gradients />
                    {this.renderLetters()}
                </div>
            </div>
        );
    }
}

export default LogoLoader;
