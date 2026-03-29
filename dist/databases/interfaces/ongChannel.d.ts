export interface OngChannel {
    channelId: number;
    channelTitle: string;
    keywords: string[];
    status: "active" | "paused";
    totalEpisodes: number;
    lastPostedAt: Date | null;
    createdBy: number;
    shareId: number;
    aIOPosterID: string;
    postMode: "direct" | "link";
    autoDeleteMinutes: number;
    pendingOwner?: string;
    createdAt: Date;
    updatedAt: Date;
}
