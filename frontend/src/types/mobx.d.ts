export interface IInitializable {
    /** Initializes after all stores are set and observed, typically you will start all side-effects of store that communicates with other stores or dependencies! */
    init(): void;
}
