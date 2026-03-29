import { WizardSessionData } from "telegraf/typings/scenes/index.js";
import { OngChannel } from "../../databases/interfaces/ongChannel.js";
export default interface OngDashboardSessionData extends WizardSessionData {
    channels?: OngChannel[];
    selectedChannelId?: number;
    page?: number;
    addChannelId?: number;
    addChannelTitle?: string;
    addKeywords?: string[];
    addPosterID?: string;
    addPostMode?: "direct" | "link";
    addAutoDeleteMinutes?: number;
    addStep?: "channelId" | "title" | "keywords" | "postMode" | "autoDelete" | "poster" | "autoCreateTitle" | "autoCreateOwner";
    editChannelId?: number;
    editField?: "title" | "keywords" | "poster" | "autoDelete" | null;
    action?: "add" | "remove" | "pause" | "resume" | "list" | "stats" | "edit" | null;
}
