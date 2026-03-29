export interface OngEpisode {
  channelId: number; // Reference to OngChannel
  messageId: number; // Telegram message ID in the channel
  filename: string; // Original filename
  caption: string; // Original caption
  postedAt: Date;
}
