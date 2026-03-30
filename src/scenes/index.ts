import { Scenes } from "telegraf";

import shareAIO from "./addAIO/index.js";

import reqAio from "./reqAIO/index.js";

import editAIO from "./editAIO/index.js";

import myInvites from "./myInvites/index.js";

import addOngoing from "./addOngoing/index.js";

import createOngoing from "./createOng/index.js";

import ongDashboard from "./ongDashboard/index.js";

import ongoingBrowse from "./ongoingBrowse/index.js";
import configDashboard from "./configDashboard/index.js";

const stage = new Scenes.Stage<Scenes.WizardContext>([
  shareAIO,
  reqAio,
  editAIO,
  myInvites,
  addOngoing,
  createOngoing,
  ongDashboard,
  ongoingBrowse,
  configDashboard,
]);

// const shareStage = new Scenes.Stage<Scenes.SceneContext>([shareScene]);

export default stage;
