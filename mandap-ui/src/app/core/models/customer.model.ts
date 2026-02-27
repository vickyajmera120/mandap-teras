// Customer Model
export interface Customer {
    id: number;
    name: string;
    mobile: string;
    palNumbers?: string[];
    address?: string;
    alternateContact?: string;
    createdAt?: string;
    updatedAt?: string;
    hasUnbilledOrders?: boolean;
    hasBilledOrders?: boolean;
    hasRentalOrders?: boolean;
}

export interface CustomerRequest {
    name: string;
    mobile: string;
    palNumbers?: string[];
    address?: string;
    alternateContact?: string;
}
