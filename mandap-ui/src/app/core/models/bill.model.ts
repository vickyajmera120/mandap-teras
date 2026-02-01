// Bill Model
export type BillType = 'ESTIMATE' | 'INVOICE';
export type PaymentStatus = 'DUE' | 'PAID' | 'PARTIAL';

export interface BillItem {
    id?: number;
    itemId: number;
    itemNameGujarati?: string;
    itemNameEnglish?: string;
    quantity: number;
    rate: number;
    total?: number;
}

export interface Bill {
    id: number;
    billNumber: string;
    customerId: number;
    customerName?: string;
    customerMobile?: string;
    palNumbers: string;
    billType: BillType;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    deposit: number;
    netPayable: number;
    billDate: string;
    remarks?: string;
    items: BillItem[];
    createdAt?: string;
    updatedAt?: string;
}

export interface BillRequest {
    customerId: number;
    billDate: string;
    palNumbers?: string;
    billType?: BillType;
    paymentStatus?: PaymentStatus;
    deposit?: number;
    remarks?: string;
    items: BillItem[];
}

export interface BillUpdateRequest {
    palNumbers?: string;
    billType?: BillType;
    paymentStatus?: PaymentStatus;
    deposit?: number;
    remarks?: string;
    items?: BillItem[];
}
