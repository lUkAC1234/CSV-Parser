export function className(baseClassName: string, classes: Record<string, boolean | undefined>): string {
    let finalClassName: string = baseClassName;

    for (const [className, condition] of Object.entries(classes)) {
        if (condition) {
            finalClassName += ` ${className}`;
        }
    }

    return finalClassName;
}
