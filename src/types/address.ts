import { Timestamp } from "firebase/firestore";

export interface Address {
    id: string,
    label?: string,
    recipient: string 
    phone: string,
    cep: string,
    street: string,
    number: string,
    complement?: string,
    neighborhood: string,
    city: string,
    state: string,
    isDefault?: boolean,
    createdAt?: Timestamp,
} 