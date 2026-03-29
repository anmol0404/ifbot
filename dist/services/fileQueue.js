/**
 * File Queue Manager
 * Manages in-memory file queues for each admin user
 * Handles 10-second batching and auto-posting
 */
import logger from "../utils/logger.js";
const AUTO_POST_DELAY_MS = 10000; // 10 seconds
class FileQueueManager {
    queues = new Map();
    onProcessCallback = null;
    /**
     * Set the callback that processes queued files
     */
    setProcessCallback(callback) {
        this.onProcessCallback = callback;
    }
    /**
     * Add a file to the admin's queue
     * Resets the 10-second timer each time
     */
    addFile(adminId, file) {
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
    async forceProcess(adminId) {
        const queue = this.queues.get(adminId);
        if (!queue || queue.files.length === 0)
            return [];
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
    toggleAutoMode(adminId) {
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
    getAutoMode(adminId) {
        const queue = this.queues.get(adminId);
        return queue?.autoMode ?? true;
    }
    /**
     * Get queue size for an admin
     */
    getQueueSize(adminId) {
        return this.queues.get(adminId)?.files.length ?? 0;
    }
    /**
     * Get queued files for an admin
     */
    getQueuedFiles(adminId) {
        return this.queues.get(adminId)?.files ?? [];
    }
    /**
     * Clear the queue for an admin (for /cancel)
     */
    clearQueue(adminId) {
        const queue = this.queues.get(adminId);
        if (!queue)
            return 0;
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
    async processQueue(adminId) {
        const queue = this.queues.get(adminId);
        if (!queue || queue.files.length === 0)
            return;
        const files = [...queue.files];
        queue.files = [];
        queue.timer = null;
        logger.info("Processing queued files", { adminId, count: files.length });
        if (this.onProcessCallback) {
            try {
                await this.onProcessCallback(adminId, files);
            }
            catch (error) {
                logger.error("Error processing file queue", {
                    adminId,
                    error: error.message,
                });
            }
        }
    }
}
// Singleton instance
const fileQueueManager = new FileQueueManager();
export default fileQueueManager;
