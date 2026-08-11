CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "needsClarification" BOOLEAN NOT NULL DEFAULT false,
    "clarificationQuestion" TEXT,
    "eatenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "calorieGoal" INTEGER NOT NULL DEFAULT 2200,
    "notificationHour" INTEGER NOT NULL DEFAULT 21,
    "notificationMinute" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailySummaryDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "dateKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySummaryDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Meal_userId_idx" ON "Meal"("userId");
CREATE INDEX "Meal_userId_eatenAt_idx" ON "Meal"("userId", "eatenAt");
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX "DailySummaryDelivery_userId_idx" ON "DailySummaryDelivery"("userId");
CREATE UNIQUE INDEX "DailySummaryDelivery_userId_dateKey_key"
    ON "DailySummaryDelivery"("userId", "dateKey");
