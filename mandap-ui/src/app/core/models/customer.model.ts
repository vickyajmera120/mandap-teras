// Customer Model
export interface Customer {
    id: number;
    name: string;
    mobile: string;
    palNumber?: string;
    address?: string;
    alternateContact?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CustomerRequest {
    name: string;
    mobile: string;
    palNumber?: string;
    address?: string;
    alternateContact?: string;
}
