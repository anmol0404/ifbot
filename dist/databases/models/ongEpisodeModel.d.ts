import mongoose, { Model } from "mongoose";
import { OngEpisode } from "../interfaces/ongEpisode.js";
export declare const ongEpisodeSchema: mongoose.Schema<OngEpisode, mongoose.Model<OngEpisode, any, any, any, mongoose.Document<unknown, any, OngEpisode> & OngEpisode & {
    _id: mongoose.Types.ObjectId;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, OngEpisode, mongoose.Document<unknown, {}, mongoose.FlatRecord<OngEpisode>> & mongoose.FlatRecord<OngEpisode> & {
    _id: mongoose.Types.ObjectId;
}>;
declare const ongEpisodeModel: Model<OngEpisode>;
export default ongEpisodeModel;
