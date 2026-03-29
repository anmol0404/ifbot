import mongoose, { Model, Schema } from "mongoose";
import { OngEpisode } from "../interfaces/ongEpisode.js";

export const ongEpisodeSchema = new Schema<OngEpisode>(
  {
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
  },
  { timestamps: true }
);

// Compound index for efficient queries
ongEpisodeSchema.index({ channelId: 1, postedAt: -1 });

const ongEpisodeModel: Model<OngEpisode> = mongoose.model("ongEpisode", ongEpisodeSchema);

export default ongEpisodeModel;
