import {
  AchievementDef,
  LevelRange,
  RankDef,
  StreakBand,
  TitleAnimationType,
  TitleItem,
} from '../types';

export const DEFAULT_RANKS: RankDef[] = [
  { id: 'rk-supreme', name: 'Supreme Grade', order: 1, color: '#FDE047', bgTint: '#2E1065', emblem: '♛' },
  { id: 'rk-special', name: 'Special Grade', order: 2, color: '#C084FC', bgTint: '#240B3B', emblem: '✦' },
  { id: 'rk-semi-special', name: 'Semi-Special', order: 3, color: '#FB7185', bgTint: '#3B071E', emblem: '❖' },
  { id: 'rk-g05', name: 'Grade 0.5', order: 4, color: '#F59E0B', bgTint: '#2B1B06', emblem: '◈' },
  { id: 'rk-g1', name: 'Grade 1', order: 5, color: '#A855F7', bgTint: '#1F1035', emblem: '▲' },
  { id: 'rk-g15', name: 'Grade 1.5', order: 6, color: '#818CF8', bgTint: '#171C3A', emblem: '◆' },
  { id: 'rk-g2', name: 'Grade 2', order: 7, color: '#38BDF8', bgTint: '#0C2438', emblem: '●' },
  { id: 'rk-g25', name: 'Grade 2.5', order: 8, color: '#34D399', bgTint: '#0A2921', emblem: '■' },
  { id: 'rk-g3', name: 'Grade 3', order: 9, color: '#E2E8F0', bgTint: '#1E293B', emblem: '◇' },
  { id: 'rk-g35', name: 'Grade 3.5', order: 10, color: '#CBD5E1', bgTint: '#17202D', emblem: '△' },
  { id: 'rk-g4', name: 'Grade 4', order: 11, color: '#94A3B8', bgTint: '#111827', emblem: '○' },
];

export const DEFAULT_LEVEL_RANGES: LevelRange[] = [
  { id: 'lr-1', startLevel: 1, endLevel: 5, tag: 'Recruit', color: '#CBD5E1', bgColor: '#1E293B', baseXp: 500, growthPercent: 10 },
  { id: 'lr-2', startLevel: 6, endLevel: 10, tag: 'Apprentice', color: '#6EE7B7', bgColor: '#064E3B', baseXp: 500, growthPercent: 10 },
  { id: 'lr-3', startLevel: 11, endLevel: 15, tag: 'First Class', color: '#7DD3FC', bgColor: '#0C4A6E', baseXp: 500, growthPercent: 10 },
  { id: 'lr-4', startLevel: 16, endLevel: 20, tag: 'Officer', color: '#A5B4FC', bgColor: '#312E81', baseXp: 500, growthPercent: 10 },
  { id: 'lr-5', startLevel: 21, endLevel: 25, tag: 'Chief Officer', color: '#C4B5FD', bgColor: '#4C1D95', baseXp: 500, growthPercent: 10 },
  { id: 'lr-6', startLevel: 26, endLevel: 30, tag: 'Vice Commander', color: '#F0ABFC', bgColor: '#701A75', baseXp: 500, growthPercent: 10 },
  { id: 'lr-7', startLevel: 31, endLevel: 35, tag: 'Commander', color: '#FDA4AF', bgColor: '#881337', baseXp: 500, growthPercent: 10 },
  { id: 'lr-8', startLevel: 36, endLevel: 50, tag: 'Captain', color: '#FCD34D', bgColor: '#78350F', baseXp: 500, growthPercent: 10 },
  { id: 'lr-9', startLevel: 51, endLevel: 65, tag: 'Rear Admiral', color: '#FDBA74', bgColor: '#7C2D12', baseXp: 500, growthPercent: 10 },
  { id: 'lr-10', startLevel: 66, endLevel: 80, tag: 'Vice Admiral', color: '#F472B6', bgColor: '#831843', baseXp: 500, growthPercent: 10 },
  { id: 'lr-11', startLevel: 81, endLevel: 100, tag: 'Admiral', color: '#FDE047', bgColor: '#422006', baseXp: 500, growthPercent: 10 },
  { id: 'lr-12', startLevel: 101, endLevel: 999, tag: 'Fleet Admiral', color: '#FFF7B2', bgColor: '#2E1065', baseXp: 500, growthPercent: 10 },
];

export const DEFAULT_STREAK_BANDS: StreakBand[] = [
  { id: 'sb-1', minDays: 0, maxDays: 10, label: 'Spark Ignited', message: 'Every discipline begins with a single spark.', color: '#94A3B8' },
  { id: 'sb-2', minDays: 11, maxDays: 20, label: 'Steady Ember', message: 'Ten days behind you—momentum is taking shape.', color: '#F59E0B' },
  { id: 'sb-3', minDays: 21, maxDays: 30, label: 'Forged Habit', message: 'Three weeks unbroken. Consistency is now your edge.', color: '#FB923C' },
  { id: 'sb-4', minDays: 31, maxDays: 40, label: 'Iron Resolve', message: 'Others pause; you continue compounding daily.', color: '#F87171' },
  { id: 'sb-5', minDays: 41, maxDays: 50, label: 'Crimson Flame', message: 'Forty days deep—discipline bends to your will.', color: '#E11D48' },
  { id: 'sb-6', minDays: 51, maxDays: 60, label: 'Violet Surge', message: 'Half a century crossed. Your pace sets the room standard.', color: '#A855F7' },
  { id: 'sb-7', minDays: 61, maxDays: 70, label: 'Shadow Aura', message: 'Sixty days of silence and sharp daily output.', color: '#8B5CF6' },
  { id: 'sb-8', minDays: 71, maxDays: 80, label: 'Royal Flare', message: 'Seventy days—few challengers survive this altitude.', color: '#D4AF37' },
  { id: 'sb-9', minDays: 81, maxDays: 90, label: 'Imperial Blaze', message: 'Eighty days unbroken. Mastery is visible in every round.', color: '#FACC15' },
  { id: 'sb-10', minDays: 91, maxDays: 100, label: 'Apex Sovereign', message: 'Approaching the century mark. Relentless precision.', color: '#FDE047' },
  { id: 'sb-11', minDays: 101, maxDays: 9999, label: 'Eternal Monarch', message: '100+ days unbroken. You have outlasted every excuse.', color: '#FFF4B8' },
];

export const DEFAULT_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'ach-1', title: 'Reach Grade 4', description: 'Entered the official DQR Ascension hierarchy.', icon: '🛡️', accentColor: '#94A3B8' },
  { id: 'ach-2', title: '7-Day Flame', description: 'Maintained seven consecutive days of academic preparation.', icon: '🔥', accentColor: '#F59E0B' },
  { id: 'ach-3', title: 'District Victor', description: 'Captured 1st Place at a district-level inter-school quiz.', icon: '👑', accentColor: '#D4AF37' },
  { id: 'ach-4', title: 'Territory Conqueror', description: 'Seized control of a competitive DQR Territory.', icon: '🏰', accentColor: '#A855F7' },
  { id: 'ach-5', title: 'Special Grade Awakened', description: 'Recognized by Administration as a Special Grade contender.', icon: '⚔️', accentColor: '#C084FC' },
  { id: 'ach-6', title: 'Century Scholar', description: 'Completed 100+ structured study questions with distinction.', icon: '📜', accentColor: '#FB7185' },
];

export const COLOR_WHEEL_PRESETS: { name: string; bg: string; text: string; border: string }[] = [
  { name: 'Shadow Monarch', bg: '#1E0B36', text: '#E9D5FF', border: '#9333EA' },
  { name: 'Imperial Gold', bg: '#261C06', text: '#FDE68A', border: '#D4AF37' },
  { name: 'Burgundy Crown', bg: '#3B0816', text: '#FECDD3', border: '#BE123C' },
  { name: 'Abyssal Blue', bg: '#091A33', text: '#BFDBFE', border: '#3B82F6' },
  { name: 'Emerald Sage', bg: '#06291E', text: '#A7F3D0', border: '#10B981' },
  { name: 'Obsidian Ember', bg: '#18100C', text: '#FDBA74', border: '#EA580C' },
  { name: 'Crimson Eclipse', bg: '#2D0707', text: '#FCA5A5', border: '#DC2626' },
  { name: 'Platinum Frost', bg: '#1E293B', text: '#F8FAFC', border: '#94A3B8' },
  { name: 'Amethyst Flare', bg: '#2E1065', text: '#F5D0FE', border: '#C026D3' },
  { name: 'Champagne Noir', bg: '#14110A', text: '#FEF08A', border: '#CA8A04' },
];

// 50 Pre-built Title Presets (for Shop & Admin Quick Picker)
const PRESET_NAMES = [
  'Shadow Monarch', 'Ace Challenger', 'Golden Tactician', 'Crimson Duelist', 'Silent Prodigy',
  'District Sovereign', 'Buzzer Phantom', 'Velvet Crown', 'Iron Scholar', 'Obsidian Sage',
  'Midnight Strategist', 'Apex Contender', 'Aurora Mind', 'Royal Arbiter', 'Violet Vanguard',
  'Gilded Sentinel', 'Burgundy Baron', 'Storm Reader', 'Rapid Fire King', 'Grand Archivist',
  'Lunar Tactician', 'Solar Sovereign', 'Astral Novice', 'Crown Seeker', 'Dawn Watcher',
  'Dusk Duelist', 'Phantom Analyst', 'Titan of Trivia', 'Oracle of Facts', 'Silver Tongue',
  'Bronze Warden', 'Master of Recall', 'Quiz Virtuoso', 'Unbroken Streak', 'First Blood',
  'Clutch Finisher', 'Tie-Breaker Ace', 'Stage Commander', 'Podium Regular', 'Finalist Elite',
  'Cold Precision', 'Ego Awakened', 'System Chosen', 'Dominion Holder', 'Citadel Keeper',
  'Starlight Mind', 'Velvet Tempest', 'Imperial Blade', 'Eternal Learner', 'Fleet Legend',
];

const ANIMATIONS: TitleAnimationType[] = [
  'shimmer', 'pulse-glow', 'float', 'neon-aura', 'gradient-sweep', 'none',
];

export const FIFTY_TITLE_PRESETS: TitleItem[] = PRESET_NAMES.map((name, idx) => {
  const palette = COLOR_WHEEL_PRESETS[idx % COLOR_WHEEL_PRESETS.length];
  const anim = ANIMATIONS[idx % ANIMATIONS.length];
  const isShop = idx < 40; // 40 shop titles + 10 exclusive non-shop presets
  return {
    id: `ttl-preset-${idx + 1}`,
    name,
    bgColor: palette.bg,
    textColor: palette.text,
    borderColor: palette.border,
    animation: anim,
    isShopItem: isShop,
    priceXp: isShop ? 300 + (idx % 10) * 200 : 0,
    description: isShop
      ? `Prestige Ascension title from the ${palette.name} collection.`
      : `Exclusive administrative honor (${palette.name}).`,
  };
});

export function getLevelRangeForLevel(
  level: number,
  ranges: LevelRange[]
): LevelRange {
  const sorted = [...ranges].sort((a, b) => a.startLevel - b.startLevel);
  const found = sorted.find(
    (r) => level >= r.startLevel && level <= r.endLevel
  );
  return found || sorted[sorted.length - 1];
}

export function getXpCostForNextLevel(
  currentLevel: number,
  ranges: LevelRange[]
): number {
  const range = getLevelRangeForLevel(currentLevel, ranges);
  const stepsFromStart = Math.max(0, currentLevel - 1);
  const factor = Math.pow(1 + range.growthPercent / 100, stepsFromStart);
  return Math.round(range.baseXp * factor);
}

export function getStreakBand(
  streak: number,
  bands: StreakBand[]
): StreakBand {
  const found = bands.find(
    (b) => streak >= b.minDays && streak <= b.maxDays
  );
  return found || bands[bands.length - 1];
}
