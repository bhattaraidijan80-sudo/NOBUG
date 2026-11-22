export type UserRole = 'admin' | 'member';

export type QuizPosition =
  | '1st'
  | '2nd'
  | '3rd'
  | '4th'
  | '5th'
  | '6th'
  | 'Not Qualified';

export interface QuizRecord {
  id: string;
  quizName: string;
  yearBS: string;
  position: QuizPosition;
  host: string;
  players: string[];
  teamCount: number;
  rating: number;
  extraNote: string;
  photos: string[];
  createdAt: number; // timestamp for tie-breaker priority
}

export interface GalleryPhoto {
  id: string;
  quizName: string;
  yearBS: string;
  host: string;
  caption: string;
  imageUrl: string;
}

export interface IntroSettings {
  establishedDate: string;
  founderName: string;
  founderPhotoUrl: string | null;
  aboutHeadline: string;
  aboutText: string;
  missionLine: string;
}

export interface StandingRow {
  player: string;
  first: number;
  second: number;
  third: number;
  fourth: number;
  fifth: number;
  sixth: number;
  totalQuizzes: number;
  qualified: number;
  notQualified: number;
  points: number;
  earliestDate: number;
}

/* ================= ASCENSION PATH ================= */

export type TitleAnimationType =
  | 'none'
  | 'shimmer'
  | 'pulse-glow'
  | 'float'
  | 'neon-aura'
  | 'gradient-sweep';

export interface TitleItem {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  animation: TitleAnimationType;
  isShopItem: boolean;
  priceXp: number;
  description: string;
}

export interface RankDef {
  id: string;
  name: string;
  order: number;
  color: string;
  bgTint: string;
  emblem: string;
}

export interface LevelRange {
  id: string;
  startLevel: number;
  endLevel: number;
  tag: string;
  color: string;
  bgColor: string;
  baseXp: number;
  growthPercent: number;
}

export interface StreakBand {
  id: string;
  minDays: number;
  maxDays: number;
  label: string;
  message: string;
  color: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
}

export interface ReportCardData {
  imageUrl: string | null;
  grade: string;
  presentation: string;
  totalQuestionsStudied: string;
  remarks: string;
  updatedAt: string;
}

export interface AuctionBid {
  userId: string;
  username: string;
  fullName: string;
  amount: number;
  timestamp: number;
}

export interface AuctionItem {
  id: string;
  title: TitleItem;
  startingBid: number;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  endsAt: number;
  settled: boolean;
  bids: AuctionBid[];
}

export interface PastWinnerRecord {
  id: string;
  userId: string;
  wonText: string;
  prizeGot: string;
  reason: string;
}

export interface DqrUser {
  id: string;
  username: string;
  pin: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  photoUrl: string | null;
  bio: string;
  favouriteTopic: string;
  isOnline: boolean;
  lastLoggedIn: string;
  xp: number;
  level: number;
  rankId: string;
  streak: number;
  tagline: string;
  announcement: string;
  announcementChecked: boolean;
  ownedTitleIds: string[];
  equippedTitleId: string | null;
  achievementIds: string[];
  equippedAchievementIds: string[]; // max 2
  reportCard: ReportCardData;
}

/* ================= TERRITORIES ================= */

export interface TerritoryQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export interface TerritoryHistoryEntry {
  id: string;
  holderUserId: string;
  holderName: string;
  score: number;
  totalQuestions: number;
  dateLabel: string;
  submittedAt?: number;
  completionSeconds?: number;
  result: 'Current' | 'Defeated';
}

export interface Territory {
  id: string;
  code: string; // e.g. TERRITORY #01
  name: string;
  description: string;
  iconType: 'citadel' | 'observatory' | 'sanctum' | 'spire' | 'bastion' | 'vault';
  customIconUrl: string | null;
  durationMinutes: number;
  currentHolderUserId: string | null;
  currentHolderName: string | null;
  highestScore: number;
  wonOn: string | null;
  questions: TerritoryQuestion[];
  history: TerritoryHistoryEntry[];
  attemptedUserIds: string[]; // locked until admin resets cooldown for user
}

/* ================= NEWSPAPER ================= */

export interface NewspaperEdition {
  masthead: string;
  volumeLabel: string;
  dateLabel: string;
  headline: string;
  subheadline: string;
  leadAuthor: string;
  leadBody: string;
  sideTitle: string;
  sideBody: string;
  quoteText: string;
  quoteAuthor: string;
  featuredImageUrl: string;
  paperBg: string;
  inkColor: string;
  accentColor: string;
}

export interface ArchivedNewspaperEdition extends NewspaperEdition {
  id: string;
  archivedAt: number;
}

/* ================= SYSTEM ================= */

export type SystemPredictionCategory =
  | 'Rank Projection'
  | 'Leaderboard Forecast'
  | 'Territorial Forecast'
  | 'Performance Prediction'
  | 'Competition Forecast'
  | 'Special Prediction';

export type ConfidenceLevel =
  | 'LOW CONFIDENCE'
  | 'MODERATE CONFIDENCE'
  | 'HIGH CONFIDENCE';

export interface SystemPrediction {
  id: string;
  title: string;
  category: SystemPredictionCategory;
  preview: string;
  fullText: string;
  confidence: ConfidenceLevel;
  publishedAt: string;
  expiresAt: string | null;
  targetUserId: string | 'all';
  published: boolean;
}

export interface SystemGuidanceItem {
  id: string;
  title: string;
  explanation: string;
  recommendedAction: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  targetUserId: string; // strictly unique per user
}

export interface SystemChallenge {
  id: string;
  title: string;
  description: string;
  category: 'Individual' | 'Competitive' | 'Territorial';
  difficulty: 'D-Rank' | 'B-Rank' | 'A-Rank' | 'S-Rank';
  rewardXp: number;
  deadline: string;
  requirementText: string;
  targetUserId: string | 'all'; // user-based OR global
  status: 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  progressCurrent: number;
  progressTarget: number;
  completedByUserIds: string[];
}

export interface EgoReport {
  id: string;
  reportNumber: string;
  title: string;
  publishedAt: string;
  period: string;
  shortPreview: string;
  targetUserId: string;
  overallAssessment: string;
  strengths: string;
  weaknesses: string;
  competitiveStanding: string;
  progression: string;
  finalVerdict: string;
  published: boolean;
}

export type VerdictClassification = string;

export interface VerdictRecord {
  userId: string;
  classification: VerdictClassification;
  description: string;
  assignedDate: string;
  status: string;
  performanceCharacteristics: string;
  strongestAttribute: string;
  biggestWeakness: string;
  competitiveTendencies: string;
  history: { classification: VerdictClassification; assignedDate: string }[];
}

export interface SystemMessage {
  id: string;
  userId: string;
  sender: 'system' | 'user';
  text: string;
  createdAt: number;
  readByAdmin: boolean;
  readByUser: boolean;
}

export interface UserGuidanceProfile {
  strategicAdvice: string;
  nextObjective: string;
}

export interface SystemConfig {
  welcomeTemplate: string;
  welcomeTemplates: string[];
  globalAnnouncement: string;
  perUserGuidance: Record<string, UserGuidanceProfile>;
  customVerdictPresets: string[];
  online: boolean;
}

export type MainTab =
  | 'home'
  | 'about'
  | 'hall-of-fame'
  | 'ascension'
  | 'territories'
  | 'newspaper'
  | 'system'
  | 'admin';

export type HofSubTab = 'gallery' | 'standings' | 'external-wins' | 'synergy';
export type AscensionSubTab =
  | 'dashboard'
  | 'shop'
  | 'auction'
  | 'users'
  | 'profile'
  | 'achievements'
  | 'report-cards'
  | 'past-winners';
export type SystemSubTab =
  | 'overview'
  | 'communication'
  | 'predictions'
  | 'guidance'
  | 'challenges'
  | 'ego-reports'
  | 'verdict'
  | 'rival';

/* ================= RIVAL ================= */

export type RivalStatus =
  | 'pending'
  | 'active'
  | 'declined'
  | 'cancelled'
  | 'ended';

export type RivalHistoryEventType =
  | 'started'
  | 'xp'
  | 'territory'
  | 'streak'
  | 'questions'
  | 'challenge'
  | 'rank'
  | 'ended';

export interface RivalHistoryEvent {
  id: string;
  timestamp: number;
  dateLabel: string;
  type: RivalHistoryEventType;
  actorUserId?: string;
  title: string;
  detail: string;
}

export interface RivalStatsSnapshot {
  territories: number;
  xpEarned: number;
  streak: number;
  questions: number;
  rankId: string;
}

export interface RivalRecord {
  id: string;
  requesterId: string;
  recipientId: string;
  status: RivalStatus;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  requesterEarnedXp: number;
  recipientEarnedXp: number;
  baselineStats?: {
    requester: RivalStatsSnapshot;
    recipient: RivalStatsSnapshot;
  };
  finalStats?: {
    requester: RivalStatsSnapshot;
    recipient: RivalStatsSnapshot;
  };
  history: RivalHistoryEvent[];
}

/* ================= WEEKLY DASHBOARD SUMMARY ================= */

export interface UserWeeklySummary {
  weekStartIso: string;
  weekLabel: string;
  xpEarned: number;
  startQuestions: number;
  currentQuestions: number;
  startStreak: number;
  currentStreak: number;
  startTerritories: number;
  territoriesAcquired: number;
  currentTerritories: number;
  dismissedEndOfWeek: boolean;
}

export interface UserWeeklyTracker {
  activeWeek: UserWeeklySummary;
  completedWeeks: UserWeeklySummary[];
}

export type AdminSubTab =
  | 'introduction'
  | 'hall-of-fame'
  | 'ascension'
  | 'territories'
  | 'newspaper'
  | 'system'
  | 'users';
