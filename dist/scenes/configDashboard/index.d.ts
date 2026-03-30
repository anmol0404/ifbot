import { Scenes } from "telegraf";
import { WizardContext } from "telegraf/typings/scenes";
import ConfigDashboardSessionData from "./sessionData.js";
type ConfigWizardContext = WizardContext<ConfigDashboardSessionData>;
declare const configDashboard: Scenes.WizardScene<ConfigWizardContext>;
export default configDashboard;
