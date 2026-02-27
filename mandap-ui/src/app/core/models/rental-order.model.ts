// Rental Order Models

export type RentalOrderStatus = 'BOOKED' | 'DISPATCHED' | 'PARTIALLY_RETURNED' | 'RETURNED' | 'COMPLETED' | 'CANCELLED';

export interface RentalOrderItem {
    id?: number;
    inventoryItemId: number;
    itemNameGujarati?: string;
    itemNameEnglish?: string;
    bookedQty: number;
    dispatchedQty?: number;
    returnedQty?: number;
    outstandingQty?: number;
    dispatchDate?: string;
    returnDate?: string;
}

export interface RentalOrder {
    id?: number;
    orderNumber?: string;
    customerId: number;
    customerName?: string;
    customerMobile?: string;
    customerPalNumbers?: string[];
    orderDate?: string;
    dispatchDate?: string;
    expectedReturnDate?: string;
    actualReturnDate?: string;
    status?: RentalOrderStatus;
    billId?: number;
    billOutOfSync?: boolean;
    remarks?: string;
    items: RentalOrderItem[];
    transactions?: RentalOrderTransaction[];
}

export interface RentalOrderTransaction {
    id?: number;
    rentalOrderId?: number;
    type?: 'DISPATCH' | 'RETURN';
    voucherNumber?: string;
    vehicleNumber?: string;
    transactionDate?: string;
    items: RentalOrderItem[];
}
