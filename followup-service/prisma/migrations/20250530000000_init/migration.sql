-- CreateTable
CREATE TABLE `follow_ups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `extinguisherId` INTEGER NOT NULL,
    `notificationId` INTEGER NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('Pending', 'Contacted', 'Unreachable', 'Escalated', 'Resolved') NOT NULL DEFAULT 'Pending',
    `contactAttempts` INTEGER NOT NULL DEFAULT 0,
    `lastContactAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `follow_ups_clientId_idx`(`clientId`),
    INDEX `follow_ups_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
