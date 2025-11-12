import { ExampleModel } from "./somewhere";

export interface ExampleModel {
    id: number;
    title: string;
    translations: Record<string, { title: string }>;
    related_model: ExampleModel[];
    created_at: string;
    updated_at: string;
}