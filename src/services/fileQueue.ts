/**
 * File Queue Manager
 * Manages in-memory file queues for each admin user
 * Handles 10-second batching and auto-posting
 */

import logger from "../utils/logger.js";

export interface QueuedFile {
  messageId: number;
  chatId: number;
  filename: string;
  caption: string;
  fileType: string; // document, video, audio, photo
  fileSize: number; // in bytes
  receivedAt: Date;
}

export interface FileQueue {
  adminId: number;
  files: QueuedFile[];
  timer: NodeJS.Timeout | null;
  autoMode: boolean;
}

const AUTO_POST_DELAY_MS = 10000; // 10 seconds

class FileQueueManager {
  private queues: Map<number, FileQueue> = new Map();
  private onProcessCallback: ((adminId: number, files: QueuedFile[]) => Promise<void>) | null = null;

  /**
   * Set the callback that processes queued files
   */
  setProcessCallback(callback: (adminId: number, files: QueuedFile[]) => Promise<void>) {
    this.onProcessCallback = callback;
  }

  /**
   * Add a file to the admin's queue
   * Resets the 10-second timer each time
   */
  addFile(adminId: number, file: QueuedFile): { queueSize: number; autoMode: boolean } {
    let queue = this.queues.get(adminId);

    if (!queue) {
      queue = {
        adminId,
        files: [],
        timer: null,
        autoMode: true, // Default auto mode ON
      };
      this.queues.set(adminId, queue);
    }

    queue.files.push(file);
    logger.info("File queued", {
      adminId,
      filename: file.filename,
      queueSize: queue.files.length,
    });

    // Reset the timer
    if (queue.timer) {
      clearTimeout(queue.timer);
    }

    if (queue.autoMode) {
      queue.timer = setTimeout(() => {
        this.processQueue(adminId);
      }, AUTO_POST_DELAY_MS);
    }

    return { queueSize: queue.files.length, autoMode: queue.autoMode };
  }

  /**
   * Force process the queue immediately (for /post command)
   */
  async forceProcess(adminId: number): Promise<QueuedFile[]> {
    const queue = this.queues.get(adminId);
    if (!queue || queue.files.length === 0) return [];

    if (queue.timer) {
      clearTimeout(queue.timer);
      queue.timer = null;
    }

    const files = [...queue.files];
    queue.files = [];

    if (this.onProcessCallback) {
      await this.onProcessCallback(adminId, files);
    }

    return files;
  }

  /**
   * Toggle auto mode for an admin
   */
  toggleAutoMode(adminId: number): boolean {
    let queue = this.queues.get(adminId);
    if (!queue) {
      queue = {
        adminId,
        files: [],
        timer: null,
        autoMode: true,
      };
      this.queues.set(adminId, queue);
    }

    queue.autoMode = !queue.autoMode;

    // If turning off auto mode, clear the timer
    if (!queue.autoMode && queue.timer) {
      clearTimeout(queue.timer);
      queue.timer = null;
    }

    logger.info("Auto mode toggled", { adminId, autoMode: queue.autoMode });
    return queue.autoMode;
  }

  /**
   * Get auto mode status for an admin
   */
  getAutoMode(adminId: number): boolean {
    const queue = this.queues.get(adminId);
    return queue?.autoMode ?? true;
  }

  /**
   * Get queue size for an admin
   */
  getQueueSize(adminId: number): number {
    return this.queues.get(adminId)?.files.length ?? 0;
  }

  /**
   * Get queued files for an admin
   */
  getQueuedFiles(adminId: number): QueuedFile[] {
    return this.queues.get(adminId)?.files ?? [];
  }

  /**
   * Clear the queue for an admin (for /cancel)
   */
  clearQueue(adminId: number): number {
    const queue = this.queues.get(adminId);
    if (!queue) return 0;

    const count = queue.files.length;
    if (queue.timer) {
      clearTimeout(queue.timer);
      queue.timer = null;
    }
    queue.files = [];
    logger.info("Queue cleared", { adminId, clearedCount: count });
    return count;
  }

  /**
   * Process the queue when timer expires
   */
  private async processQueue(adminId: number) {
    const queue = this.queues.get(adminId);
    if (!queue || queue.files.length === 0) return;

    const files = [...queue.files];
    queue.files = [];
    queue.timer = null;

    logger.info("Processing queued files", { adminId, count: files.length });

    if (this.onProcessCallback) {
      try {
        await this.onProcessCallback(adminId, files);
      } catch (error) {
        logger.error("Error processing file queue", {
          adminId,
          error: (error as Error).message,
        });
      }
    }
  }
}

// Singleton instance
const fileQueueManager = new FileQueueManager();
export default fileQueueManager;
