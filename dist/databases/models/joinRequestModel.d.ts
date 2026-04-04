import { Model, Document } from "mongoose";
export interface IJoinRequest {
    userId: number;
    chatId: number;
    requestedAt: Date;
}
export type JoinRequestDocument = IJoinRequest & Document;
declare const JoinRequestModel: Model<JoinRequestDocument>;
export default JoinRequestModel;
