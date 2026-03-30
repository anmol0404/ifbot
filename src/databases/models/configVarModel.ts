import mongoose from "mongoose";
import { IConfigVar } from "../interfaces/configVar.js";

const ConfigVarSchema = new mongoose.Schema<IConfigVar>({
  key: { type: String, required: true, unique: true },
  encryptedValue: { type: String, required: true },
  category: { type: String, required: true, enum: ["channels", "links", "text", "ai", "tokens"] },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Number, required: true },
});

const ConfigVarModel = mongoose.model<IConfigVar>("ConfigVar", ConfigVarSchema);
export default ConfigVarModel;
