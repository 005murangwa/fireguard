-- CreateTable
CREATE TABLE `extinguishers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serialNumber` VARCHAR(100) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `purchaseDate` DATETIME(3) NOT NULL,
    `expiryDate` DATETIME(3) NOT NULL,
    `status` ENUM('Active', 'ExpiringSoon', 'Expired') NOT NULL DEFAULT 'Active',
    `clientId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `extinguishers_serialNumber_key`(`serialNumber`),
    INDEX `extinguishers_clientId_idx`(`clientId`),
    INDEX `extinguishers_expiryDate_idx`(`expiryDate`),
    INDEX `extinguishers_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
