import { model, Schema, Model, Document } from "mongoose";

export interface IJoinRequest {
  userId: number;
  chatId: number;
  requestedAt: Date;
}

export type JoinRequestDocument = IJoinRequest & Document;

const joinRequestSchema: Schema<JoinRequestDocument> = new Schema<JoinRequestDocument>({
  userId: { type: Number, required: true },
  chatId: { type: Number, required: true },
  requestedAt: { type: Date, default: Date.now },
});

// Compound index to ensure uniqueness per user per chat
joinRequestSchema.index({ userId: 1, chatId: 1 }, { unique: true });

const JoinRequestModel: Model<JoinRequestDocument> = model<JoinRequestDocument>(
  "joinrequests",
  joinRequestSchema
);

export default JoinRequestModel;
