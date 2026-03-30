import { WizardSessionData } from "telegraf/typings/scenes/index.js";
import { OngChannel } from "../../databases/interfaces/ongChannel.js";
export default interface OngoingBrowseSessionData extends WizardSessionData {
    channels?: OngChannel[];
    page?: number;
    query?: string;
    prevCb?: string;
    nextCb?: string;
}
