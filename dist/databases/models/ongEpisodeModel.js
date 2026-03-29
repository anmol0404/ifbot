import mongoose, { Schema } from "mongoose";
export const ongEpisodeSchema = new Schema({
    channelId: {
        type: Number,
        required: true,
        index: true,
    },
    messageId: {
        type: Number,
        required: true,
    },
    filename: {
        type: String,
        default: "",
    },
    caption: {
        type: String,
        default: "",
    },
    postedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
// Compound index for efficient queries
ongEpisodeSchema.index({ channelId: 1, postedAt: -1 });
const ongEpisodeModel = mongoose.model("ongEpisode", ongEpisodeSchema);
export default ongEpisodeModel;
