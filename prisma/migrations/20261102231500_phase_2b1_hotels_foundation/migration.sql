-- CreateTable
CREATE TABLE `hotels` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `nameAr` VARCHAR(200) NULL,
    `description` TEXT NOT NULL,
    `propertyType` ENUM('HOTEL', 'RESORT', 'BOUTIQUE', 'APARTMENT', 'VILLA', 'MOTEL', 'GUESTHOUSE', 'BED_AND_BREAKFAST') NOT NULL DEFAULT 'HOTEL',
    `starRating` TINYINT NULL,
    `countryCode` CHAR(2) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `postalCode` VARCHAR(32) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `phone` VARCHAR(32) NULL,
    `email` VARCHAR(190) NULL,
    `website` VARCHAR(255) NULL,
    `checkInTime` VARCHAR(8) NOT NULL DEFAULT '15:00',
    `checkOutTime` VARCHAR(8) NOT NULL DEFAULT '11:00',
    `coverImage` VARCHAR(500) NULL,
    `gallery` LONGTEXT NOT NULL DEFAULT '[]',
    `amenities` LONGTEXT NOT NULL DEFAULT '[]',
    `seoTitle` VARCHAR(200) NULL,
    `seoDescription` VARCHAR(500) NULL,
    `translations` LONGTEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hotels_slug_key`(`slug`),
    INDEX `hotels_status_city_idx`(`status`, `city`),
    INDEX `hotels_countryCode_city_idx`(`countryCode`, `city`),
    INDEX `hotels_starRating_idx`(`starRating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hotel_policies` (
    `id` VARCHAR(191) NOT NULL,
    `hotelId` VARCHAR(191) NOT NULL,
    `checkInAge` INTEGER NOT NULL DEFAULT 18,
    `checkInInstructions` TEXT NULL,
    `childAgeMax` INTEGER NOT NULL DEFAULT 11,
    `infantAgeMax` INTEGER NOT NULL DEFAULT 2,
    `allowExtraBeds` BOOLEAN NOT NULL DEFAULT false,
    `extraBedPricePerNight` DECIMAL(10, 2) NULL,
    `allowCribs` BOOLEAN NOT NULL DEFAULT false,
    `cribPricePerNight` DECIMAL(10, 2) NULL,
    `petsAllowed` BOOLEAN NOT NULL DEFAULT false,
    `petFeePerStay` DECIMAL(10, 2) NULL,
    `cancellationSummary` TEXT NULL,
    `paymentPolicy` TEXT NULL,
    `depositRequired` BOOLEAN NOT NULL DEFAULT false,
    `depositPercentage` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `customPolicies` LONGTEXT NULL,
    `translations` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hotel_policies_hotelId_key`(`hotelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hotel_room_types` (
    `id` VARCHAR(191) NOT NULL,
    `hotelId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `maxAdults` INTEGER NOT NULL DEFAULT 2,
    `maxChildren` INTEGER NOT NULL DEFAULT 1,
    `maxOccupancy` INTEGER NOT NULL DEFAULT 3,
    `bedConfiguration` VARCHAR(120) NULL,
    `roomSizeSqm` DECIMAL(6, 2) NULL,
    `amenities` LONGTEXT NOT NULL DEFAULT '[]',
    `gallery` LONGTEXT NOT NULL DEFAULT '[]',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `translations` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hotel_room_types_hotelId_isActive_idx`(`hotelId`, `isActive`),
    UNIQUE INDEX `hotel_room_types_hotelId_code_key`(`hotelId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hotel_rate_plans` (
    `id` VARCHAR(191) NOT NULL,
    `roomTypeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `boardBasis` ENUM('ROOM_ONLY', 'BED_AND_BREAKFAST', 'HALF_BOARD', 'FULL_BOARD', 'ALL_INCLUSIVE', 'ULTRA_ALL_INCLUSIVE') NOT NULL DEFAULT 'ROOM_ONLY',
    `isRefundable` BOOLEAN NOT NULL DEFAULT true,
    `cancellationPolicy` TEXT NULL,
    `cancellationDeadlineDays` INTEGER NULL DEFAULT 2,
    `cancellationPenaltyPercent` DECIMAL(5, 2) NULL DEFAULT 100.00,
    `currency` CHAR(3) NOT NULL DEFAULT 'USD',
    `basePrice` DECIMAL(10, 2) NOT NULL,
    `minStayNights` INTEGER NOT NULL DEFAULT 1,
    `maxStayNights` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `translations` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hotel_rate_plans_roomTypeId_isActive_idx`(`roomTypeId`, `isActive`),
    UNIQUE INDEX `hotel_rate_plans_roomTypeId_code_key`(`roomTypeId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hotel_room_inventory` (
    `id` VARCHAR(191) NOT NULL,
    `roomTypeId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `totalRooms` INTEGER NOT NULL DEFAULT 1,
    `bookedRooms` INTEGER NOT NULL DEFAULT 0,
    `heldRooms` INTEGER NOT NULL DEFAULT 0,
    `stopSale` BOOLEAN NOT NULL DEFAULT false,
    `closedToArrival` BOOLEAN NOT NULL DEFAULT false,
    `closedToDeparture` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hotel_room_inventory_date_stopSale_idx`(`date`, `stopSale`),
    UNIQUE INDEX `hotel_room_inventory_roomTypeId_date_key`(`roomTypeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hotel_daily_rates` (
    `id` VARCHAR(191) NOT NULL,
    `ratePlanId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `stopSale` BOOLEAN NOT NULL DEFAULT false,
    `closedToArrival` BOOLEAN NOT NULL DEFAULT false,
    `closedToDeparture` BOOLEAN NOT NULL DEFAULT false,
    `minStay` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hotel_daily_rates_date_idx`(`date`),
    UNIQUE INDEX `hotel_daily_rates_ratePlanId_date_key`(`ratePlanId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hotel_inventory_locks` (
    `id` VARCHAR(191) NOT NULL,
    `lockToken` VARCHAR(64) NOT NULL,
    `roomTypeId` VARCHAR(191) NOT NULL,
    `ratePlanId` VARCHAR(191) NULL,
    `checkInDate` DATE NOT NULL,
    `checkOutDate` DATE NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `expiresAt` DATETIME(3) NOT NULL,
    `releasedAt` DATETIME(3) NULL,
    `isConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `bookingRef` VARCHAR(32) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `hotel_inventory_locks_lockToken_key`(`lockToken`),
    INDEX `hotel_inventory_locks_roomTypeId_checkInDate_checkOutDate_idx`(`roomTypeId`, `checkInDate`, `checkOutDate`),
    INDEX `hotel_inventory_locks_expiresAt_isConfirmed_idx`(`expiresAt`, `isConfirmed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hotel_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `hotelId` VARCHAR(191) NOT NULL,
    `hotelName` VARCHAR(200) NOT NULL,
    `checkInDate` DATE NOT NULL,
    `checkOutDate` DATE NOT NULL,
    `nights` INTEGER NOT NULL,
    `guestName` VARCHAR(100) NOT NULL,
    `guestEmail` VARCHAR(190) NOT NULL,
    `guestPhone` VARCHAR(32) NULL,
    `specialRequests` TEXT NULL,
    `status` ENUM('HOLD', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING',
    `cancellationReason` VARCHAR(255) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `totalPrice` DECIMAL(10, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'USD',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hotel_bookings_bookingId_idx`(`bookingId`),
    INDEX `hotel_bookings_hotelId_checkInDate_idx`(`hotelId`, `checkInDate`),
    INDEX `hotel_bookings_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hotel_booking_rooms` (
    `id` VARCHAR(191) NOT NULL,
    `hotelBookingId` VARCHAR(191) NOT NULL,
    `roomTypeId` VARCHAR(191) NOT NULL,
    `ratePlanId` VARCHAR(191) NOT NULL,
    `roomTypeName` VARCHAR(150) NOT NULL,
    `ratePlanName` VARCHAR(150) NOT NULL,
    `boardBasis` ENUM('ROOM_ONLY', 'BED_AND_BREAKFAST', 'HALF_BOARD', 'FULL_BOARD', 'ALL_INCLUSIVE', 'ULTRA_ALL_INCLUSIVE') NOT NULL,
    `adults` INTEGER NOT NULL DEFAULT 2,
    `children` INTEGER NOT NULL DEFAULT 0,
    `childAges` VARCHAR(100) NULL,
    `nightlyBreakdown` LONGTEXT NOT NULL,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `hotel_booking_rooms_hotelBookingId_idx`(`hotelBookingId`),
    INDEX `hotel_booking_rooms_roomTypeId_idx`(`roomTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hotel_policies` ADD CONSTRAINT `hotel_policies_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `hotels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_room_types` ADD CONSTRAINT `hotel_room_types_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `hotels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_rate_plans` ADD CONSTRAINT `hotel_rate_plans_roomTypeId_fkey` FOREIGN KEY (`roomTypeId`) REFERENCES `hotel_room_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_room_inventory` ADD CONSTRAINT `hotel_room_inventory_roomTypeId_fkey` FOREIGN KEY (`roomTypeId`) REFERENCES `hotel_room_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_daily_rates` ADD CONSTRAINT `hotel_daily_rates_ratePlanId_fkey` FOREIGN KEY (`ratePlanId`) REFERENCES `hotel_rate_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_inventory_locks` ADD CONSTRAINT `hotel_inventory_locks_roomTypeId_fkey` FOREIGN KEY (`roomTypeId`) REFERENCES `hotel_room_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_bookings` ADD CONSTRAINT `hotel_bookings_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_bookings` ADD CONSTRAINT `hotel_bookings_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `hotels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_booking_rooms` ADD CONSTRAINT `hotel_booking_rooms_hotelBookingId_fkey` FOREIGN KEY (`hotelBookingId`) REFERENCES `hotel_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_booking_rooms` ADD CONSTRAINT `hotel_booking_rooms_roomTypeId_fkey` FOREIGN KEY (`roomTypeId`) REFERENCES `hotel_room_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_booking_rooms` ADD CONSTRAINT `hotel_booking_rooms_ratePlanId_fkey` FOREIGN KEY (`ratePlanId`) REFERENCES `hotel_rate_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

