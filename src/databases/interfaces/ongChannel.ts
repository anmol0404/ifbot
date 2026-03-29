export interface OngChannel {
  channelId: number; // Telegram channel ID where files get posted
  channelTitle: string; // Display name e.g. "One Piece"
  keywords: string[]; // Matching keywords: ["one piece", "onepiece", "op"]
  status: "active" | "paused";
  totalEpisodes: number; // Counter
  lastPostedAt: Date | null;
  createdBy: number; // Admin user ID
  shareId: number; // For user-facing share links
  aIOPosterID: string; // Poster image
  postMode: "direct" | "link"; // direct = post files, link = poster + links via /start
  autoDeleteMinutes: number; // 0 = no auto-delete, >0 = delete links after N minutes
  pendingOwner?: string; // Username awaiting ownership transfer (after 24h admin requirement)
  createdAt: Date;
  updatedAt: Date;
}
