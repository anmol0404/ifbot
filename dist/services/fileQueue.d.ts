/**
 * File Queue Manager
 * Manages in-memory file queues for each admin user
 * Handles 10-second batching and auto-posting
 */
export interface QueuedFile {
    messageId: number;
    chatId: number;
    filename: string;
    caption: string;
    fileType: string;
    fileSize: number;
    receivedAt: Date;
}
export interface FileQueue {
    adminId: number;
    files: QueuedFile[];
    timer: NodeJS.Timeout | null;
    autoMode: boolean;
}
declare class FileQueueManager {
    private queues;
    private onProcessCallback;
    /**
     * Set the callback that processes queued files
     */
    setProcessCallback(callback: (adminId: number, files: QueuedFile[]) => Promise<void>): void;
    /**
     * Add a file to the admin's queue
     * Resets the 10-second timer each time
     */
    addFile(adminId: number, file: QueuedFile): {
        queueSize: number;
        autoMode: boolean;
    };
    /**
     * Force process the queue immediately (for /post command)
     */
    forceProcess(adminId: number): Promise<QueuedFile[]>;
    /**
     * Toggle auto mode for an admin
     */
    toggleAutoMode(adminId: number): boolean;
    /**
     * Get auto mode status for an admin
     */
    getAutoMode(adminId: number): boolean;
    /**
     * Get queue size for an admin
     */
    getQueueSize(adminId: number): number;
    /**
     * Get queued files for an admin
     */
    getQueuedFiles(adminId: number): QueuedFile[];
    /**
     * Clear the queue for an admin (for /cancel)
     */
    clearQueue(adminId: number): number;
    /**
     * Process the queue when timer expires
     */
    private processQueue;
}
declare const fileQueueManager: FileQueueManager;
export default fileQueueManager;
