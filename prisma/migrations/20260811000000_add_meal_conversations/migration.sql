ALTER TABLE "Meal"
ADD COLUMN "sourcePrompt" TEXT,
ADD COLUMN "model" TEXT;

CREATE TYPE "ConversationRole" AS ENUM ('USER', 'ASSISTANT');

CREATE TABLE "MealMessage" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "role" "ConversationRole" NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MealMessage_mealId_createdAt_idx"
ON "MealMessage"("mealId", "createdAt");

ALTER TABLE "MealMessage"
ADD CONSTRAINT "MealMessage_mealId_fkey"
FOREIGN KEY ("mealId") REFERENCES "Meal"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
