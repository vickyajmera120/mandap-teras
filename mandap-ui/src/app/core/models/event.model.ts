// Event Model
export type EventType = 'FAGUN_SUD_13' | 'NORMAL';

export interface Event {
    id: number;
    name: string;
    type: EventType;
    year: number;
    eventDate?: string;

    active: boolean;
    createdAt?: string;
}

export interface EventRequest {
    name: string;
    type: EventType;
    year: number;
    eventDate?: string;

    active?: boolean;
}
