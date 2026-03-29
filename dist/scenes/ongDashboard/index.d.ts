import { Scenes } from "telegraf";
import { WizardContext } from "telegraf/typings/scenes";
import OngDashboardSessionData from "./sessionData.js";
type OngWizardContext = WizardContext<OngDashboardSessionData>;
declare const ongDashboard: Scenes.WizardScene<OngWizardContext>;
export default ongDashboard;
