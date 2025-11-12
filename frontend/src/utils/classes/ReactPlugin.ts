export abstract class ReactAppPlugin {
    abstract setup<T>(options?: T): void;
}
