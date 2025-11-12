type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`;

export type DeepKeys<T> = {
    [K in keyof T & string]: T[K] extends object ? `${K}${DotPrefix<DeepKeys<T[K]>>}` : K;
}[keyof T & string];
