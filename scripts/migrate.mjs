import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const sql = `
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "League" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sport" TEXT NOT NULL DEFAULT 'football',
    "season" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pre_draft',
    "avatarUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "inviteCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "rosterQB" INTEGER NOT NULL DEFAULT 1,
    "rosterRB" INTEGER NOT NULL DEFAULT 2,
    "rosterWR" INTEGER NOT NULL DEFAULT 2,
    "rosterTE" INTEGER NOT NULL DEFAULT 1,
    "rosterFLEX" INTEGER NOT NULL DEFAULT 1,
    "rosterK" INTEGER NOT NULL DEFAULT 1,
    "rosterBench" INTEGER NOT NULL DEFAULT 6,
    "rosterIR" INTEGER NOT NULL DEFAULT 1,
    "maxRosters" INTEGER NOT NULL DEFAULT 10,
    "scoringPassYds" REAL NOT NULL DEFAULT 0.04,
    "scoringPassTD" REAL NOT NULL DEFAULT 4,
    "scoringPassInt" REAL NOT NULL DEFAULT -2,
    "scoringRushYds" REAL NOT NULL DEFAULT 0.1,
    "scoringRushTD" REAL NOT NULL DEFAULT 6,
    "scoringRecYds" REAL NOT NULL DEFAULT 0.1,
    "scoringRecTD" REAL NOT NULL DEFAULT 6,
    "scoringReception" REAL NOT NULL DEFAULT 1,
    "scoringFumble" REAL NOT NULL DEFAULT -2,
    "scoring2pt" REAL NOT NULL DEFAULT 2,
    "waiverType" TEXT NOT NULL DEFAULT 'rolling',
    "waiverBudget" INTEGER NOT NULL DEFAULT 100,
    "waiverDays" INTEGER NOT NULL DEFAULT 2,
    "waiverDeadline" TEXT NOT NULL DEFAULT 'tuesday',
    "tradeDeadlineWeek" INTEGER NOT NULL DEFAULT 12,
    "tradeReviewDays" INTEGER NOT NULL DEFAULT 1,
    "tradeVeto" TEXT NOT NULL DEFAULT 'commissioner',
    "playoffStartWeek" INTEGER NOT NULL DEFAULT 14,
    "playoffTeams" INTEGER NOT NULL DEFAULT 4,
    "regularSeasonWeeks" INTEGER NOT NULL DEFAULT 13,
    "currentWeek" INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS "LeagueMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "waiverOrder" INTEGER NOT NULL DEFAULT 0,
    "faabBudget" INTEGER NOT NULL DEFAULT 100,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "ties" INTEGER NOT NULL DEFAULT 0,
    "pointsFor" REAL NOT NULL DEFAULT 0,
    "pointsAgainst" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "jerseyNumber" INTEGER,
    "teamName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "injuryNote" TEXT,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "RosterPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueMemberId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "slot" TEXT NOT NULL DEFAULT 'bench',
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RosterPlayer_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RosterPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "SeasonSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "startDate" DATETIME,
    "endDate" DATETIME,
    CONSTRAINT "SeasonSchedule_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Matchup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homePoints" REAL NOT NULL DEFAULT 0,
    "awayPoints" REAL NOT NULL DEFAULT 0,
    "homeProjected" REAL NOT NULL DEFAULT 0,
    "awayProjected" REAL NOT NULL DEFAULT 0,
    "winnerId" TEXT,
    "isPlayoff" BOOLEAN NOT NULL DEFAULT false,
    "playoffRound" INTEGER,
    CONSTRAINT "Matchup_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "SeasonSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Matchup_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "LeagueMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Matchup_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "LeagueMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "WeekStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "passYds" REAL NOT NULL DEFAULT 0,
    "passTDs" REAL NOT NULL DEFAULT 0,
    "passInts" REAL NOT NULL DEFAULT 0,
    "passAtts" REAL NOT NULL DEFAULT 0,
    "passComps" REAL NOT NULL DEFAULT 0,
    "rushYds" REAL NOT NULL DEFAULT 0,
    "rushTDs" REAL NOT NULL DEFAULT 0,
    "rushAtts" REAL NOT NULL DEFAULT 0,
    "recYds" REAL NOT NULL DEFAULT 0,
    "recTDs" REAL NOT NULL DEFAULT 0,
    "receptions" REAL NOT NULL DEFAULT 0,
    "targets" REAL NOT NULL DEFAULT 0,
    "fumbles" REAL NOT NULL DEFAULT 0,
    "twoPointConversions" REAL NOT NULL DEFAULT 0,
    "fantasyPoints" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "WeekStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WeekStats_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "SeasonSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'snake',
    "status" TEXT NOT NULL DEFAULT 'pre_draft',
    "currentPick" INTEGER NOT NULL DEFAULT 0,
    "totalPicks" INTEGER NOT NULL DEFAULT 0,
    "pickTimer" INTEGER NOT NULL DEFAULT 90,
    "draftOrder" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "Draft_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "DraftPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "leagueMemberId" TEXT NOT NULL,
    "playerId" TEXT,
    "round" INTEGER NOT NULL,
    "pickNumber" INTEGER NOT NULL,
    "pickedAt" DATETIME,
    "isAutoPick" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DraftPick_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DraftPick_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DraftPick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "WaiverClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "leagueMemberId" TEXT NOT NULL,
    "addPlayerId" TEXT NOT NULL,
    "dropPlayerId" TEXT,
    "bidAmount" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaiverClaim_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaiverClaim_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaiverClaim_addPlayerId_fkey" FOREIGN KEY ("addPlayerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaiverClaim_dropPlayerId_fkey" FOREIGN KEY ("dropPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "proposedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trade_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "LeagueMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trade_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "LeagueMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trade_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "TradeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "playerId" TEXT,
    CONSTRAINT "TradeItem_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradeItem_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "LeagueMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TradeItem_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "LeagueMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TradeItem_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" DATETIME,
    CONSTRAINT "ChatMessage_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ChatReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    CONSTRAINT "ChatReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "leagueId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "League_inviteCode_key" ON "League"("inviteCode");
CREATE UNIQUE INDEX IF NOT EXISTS "LeagueMember_leagueId_userId_key" ON "LeagueMember"("leagueId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "RosterPlayer_leagueMemberId_playerId_key" ON "RosterPlayer"("leagueMemberId", "playerId");
CREATE UNIQUE INDEX IF NOT EXISTS "SeasonSchedule_leagueId_week_key" ON "SeasonSchedule"("leagueId", "week");
CREATE UNIQUE INDEX IF NOT EXISTS "WeekStats_playerId_scheduleId_key" ON "WeekStats"("playerId", "scheduleId");
CREATE UNIQUE INDEX IF NOT EXISTS "DraftPick_draftId_pickNumber_key" ON "DraftPick"("draftId", "pickNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "ChatReaction_messageId_userId_emoji_key" ON "ChatReaction"("messageId", "userId", "emoji");
`;

await client.executeMultiple(sql);
console.log("Database migration complete.");
