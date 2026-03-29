import { WizardSessionData } from "telegraf/typings/scenes/index.js";
import { OngChannel } from "../../databases/interfaces/ongChannel.js";

export default interface OngDashboardSessionData extends WizardSessionData {
  channels?: OngChannel[];
  selectedChannelId?: number;
  page?: number;
  // Add channel wizard state
  addChannelId?: number;
  addChannelTitle?: string;
  addKeywords?: string[];
  addPosterID?: string;
  addPostMode?: "direct" | "link";
  addAutoDeleteMinutes?: number;
  // Track wizard sub-step
  addStep?: "channelId" | "title" | "keywords" | "postMode" | "autoDelete" | "poster" | "autoCreateTitle" | "autoCreateOwner";
  // Edit channel state
  editChannelId?: number;
  editField?: "title" | "keywords" | "poster" | "autoDelete" | null;
  // Tracking which action we're in
  action?: "add" | "remove" | "pause" | "resume" | "list" | "stats" | "edit" | null;
}
