import { WizardSessionData } from "telegraf/typings/scenes/index.js";

export default interface ConfigDashboardSessionData extends WizardSessionData {
  currentCategory?: string | null;
  editingKey?: string | null;
  awaitingInput?: boolean;
}
