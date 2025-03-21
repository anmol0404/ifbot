import { WizardSessionData } from "telegraf/typings/scenes";
export interface AIOSessionData extends WizardSessionData {
    aIOTitle?: string;
    backupChannel?: string;
    file?: string;
    messageIds?: number[];
    aIOPosterID?: string;
    webPhotoUrl?: string;
    done?: boolean;
    isHindi?: boolean;
    captions?: string[];
}
