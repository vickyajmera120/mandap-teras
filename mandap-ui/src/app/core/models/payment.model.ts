export interface Payment {
    id?: number;
    billId: number;
    amount: number;
    paymentDate: string; // ISO Date string
    paymentMethod: 'CASH' | 'CHEQUE' | 'ONLINE';
    chequeNumber?: string;
    remarks?: string;
    isDeposit?: boolean;
}
