import { AIOSessionData } from "./wizardSessionData.js";
import AIOWizardContext from "./ongWizardContext.js";
declare function askTitleAIO(ctx: AIOWizardContext): Promise<import("telegraf/typings/scenes.js").WizardContextWizard<import("telegraf/typings/scenes.js").WizardContext<AIOSessionData>>>;
declare function handleTitleAskPoster(ctx: AIOWizardContext): Promise<void | import("telegraf/typings/scenes.js").WizardContextWizard<import("telegraf/typings/scenes.js").WizardContext<AIOSessionData>>>;
declare function handlePosterAskRelatedMsg(ctx: AIOWizardContext): Promise<void | import("telegraf/typings/scenes.js").WizardContextWizard<import("telegraf/typings/scenes.js").WizardContext<AIOSessionData>>>;
declare function done(ctx: AIOWizardContext): Promise<void>;
export { askTitleAIO, handleTitleAskPoster, done, handlePosterAskRelatedMsg };
