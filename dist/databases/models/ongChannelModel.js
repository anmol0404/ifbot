import mongoose, { Schema } from "mongoose";
export const ongChannelSchema = new Schema({
    channelId: {
        type: Number,
        required: true,
        unique: true,
    },
    channelTitle: {
        type: String,
        required: true,
    },
    keywords: {
        type: [String],
        required: true,
        default: [],
    },
    status: {
        type: String,
        enum: ["active", "paused"],
        default: "active",
    },
    totalEpisodes: {
        type: Number,
        default: 0,
    },
    lastPostedAt: {
        type: Date,
        default: null,
    },
    createdBy: {
        type: Number,
        required: true,
    },
    shareId: {
        type: Number,
        required: true,
        unique: true,
    },
    aIOPosterID: {
        type: String,
        default: "",
    },
    postMode: {
        type: String,
        enum: ["direct", "link"],
        default: "link",
    },
    autoDeleteMinutes: {
        type: Number,
        default: 0,
    },
    pendingOwner: {
        type: String,
        default: undefined,
    },
}, { timestamps: true });
const ongChannelModel = mongoose.model("ongChannel", ongChannelSchema);
export default ongChannelModel;
