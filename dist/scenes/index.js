import { Scenes } from "telegraf";
import shareAIO from "./addAIO/index.js";
import reqAio from "./reqAIO/index.js";
import editAIO from "./editAIO/index.js";
import myInvites from "./myInvites/index.js";
import addOngoing from "./addOngoing/index.js";
import createOngoing from "./createOng/index.js";
const stage = new Scenes.Stage([
    shareAIO,
    reqAio,
    editAIO,
    myInvites,
    addOngoing,
    createOngoing,
]);
// const shareStage = new Scenes.Stage<Scenes.SceneContext>([shareScene]);
export default stage;
