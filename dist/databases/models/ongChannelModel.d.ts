import mongoose, { Model } from "mongoose";
import { OngChannel } from "../interfaces/ongChannel.js";
export declare const ongChannelSchema: mongoose.Schema<OngChannel, mongoose.Model<OngChannel, any, any, any, mongoose.Document<unknown, any, OngChannel> & OngChannel & {
    _id: mongoose.Types.ObjectId;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, OngChannel, mongoose.Document<unknown, {}, mongoose.FlatRecord<OngChannel>> & mongoose.FlatRecord<OngChannel> & {
    _id: mongoose.Types.ObjectId;
}>;
declare const ongChannelModel: Model<OngChannel>;
export default ongChannelModel;
