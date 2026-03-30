import { Document } from "mongoose";
export interface IConfigVar extends Document {
    key: string;
    encryptedValue: string;
    category: string;
    updatedAt: Date;
    updatedBy: number;
}
