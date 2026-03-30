import mongoose from "mongoose";
import { IConfigVar } from "../interfaces/configVar.js";
declare const ConfigVarModel: mongoose.Model<IConfigVar, {}, {}, {}, mongoose.Document<unknown, {}, IConfigVar> & IConfigVar & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default ConfigVarModel;
