import { model, Schema } from "mongoose";
const joinRequestSchema = new Schema({
    userId: { type: Number, required: true },
    chatId: { type: Number, required: true },
    requestedAt: { type: Date, default: Date.now },
});
// Compound index to ensure uniqueness per user per chat
joinRequestSchema.index({ userId: 1, chatId: 1 }, { unique: true });
const JoinRequestModel = model("joinrequests", joinRequestSchema);
export default JoinRequestModel;
