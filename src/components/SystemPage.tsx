import { FormEvent, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Award,
  Bell,
  Castle,
  Compass,
  Eye,
  FileText,
  Fingerprint,
  LineChart,
  MessageSquare,
  Send,
  ShieldAlert,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import {
  ConfidenceLevel,
  DqrUser,
  EgoReport,
  QuizRecord,
  RankDef,
  RivalRecord,
  SystemChallenge,
  SystemConfig,
  SystemGuidanceItem,
  SystemMessage,
  SystemPrediction,
  SystemPredictionCategory,
  SystemSubTab,
  Territory,
  VerdictRecord,
} from '../types';
import { RivalPanel } from './RivalPanel';

interface SystemPageProps {
  currentUser: DqrUser;
  users: DqrUser[];
  ranks: RankDef[];
  config: SystemConfig;
  messages: SystemMessage[];
  predictions: SystemPrediction[];
  guidance: SystemGuidanceItem[];
  challenges: SystemChallenge[];
  egoReports: EgoReport[];
  verdict: VerdictRecord | undefined;
  quizzes: QuizRecord[];
  territories: Territory[];
  rivalries: RivalRecord[];
  onSendMessage: (userId: string, text: string) => void;
  onMarkMessagesRead: (userId: string) => void;
  onClaimChallenge: (challengeId: string, userId: string) => void;
  onSendRivalRequest: (requesterId: string, recipientId: string) => string | null;
  onRespondRivalRequest: (rivalryId: string, accept: boolean) => void;
  onCancelRivalRequest: (rivalryId: string) => void;
  onEndRivalry: (rivalryId: string, endedByUserId: string) => void;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getCategoryStyle(category: SystemPredictionCategory) {
  switch (category) {
    case 'Rank Projection':
      return { color: '#3988FF', icon: TrendingUp };
    case 'Leaderboard Forecast':
      return { color: '#A78BFA', icon: Trophy };
    case 'Territorial Forecast':
      return { color: '#EF4444', icon: Castle };
    case 'Performance Prediction':
      return { color: '#83B9FF', icon: LineChart };
    case 'Competition Forecast':
      return { color: '#F59E0B', icon: Swords };
    case 'Special Prediction':
      return { color: '#C0C7D4', icon: Eye };
  }
}

function getConfidenceWidth(conf: ConfidenceLevel): string {
  if (conf === 'HIGH CONFIDENCE') return '90%';
  if (conf === 'MODERATE CONFIDENCE') return '60%';
  return '32%';
}

export function SystemPage({
  currentUser,
  users,
  ranks,
  config,
  messages,
  predictions,
  guidance,
  challenges,
  egoReports,
  verdict,
  quizzes,
  territories,
  rivalries,
  onSendMessage,
  onMarkMessagesRead,
  onClaimChallenge,
  onSendRivalRequest,
  onRespondRivalRequest,
  onCancelRivalRequest,
  onEndRivalry,
}: SystemPageProps) {
  const [subTab, setSubTab] = useState<SystemSubTab>('overview');
  const [messageInput, setMessageInput] = useState('');
  const [selectedPrediction, setSelectedPrediction] =
    useState<SystemPrediction | null>(null);
  const [selectedChallenge, setSelectedChallenge] =
    useState<SystemChallenge | null>(null);
  const [selectedReport, setSelectedReport] = useState<EgoReport | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter private + global records for currentUser
  const userMessages = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    return messages
      .filter((m) => m.userId === currentUser.id && m.createdAt >= cutoff)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [messages, currentUser.id]);

  const unreadCount = useMemo(
    () =>
      userMessages.filter((m) => m.sender === 'system' && !m.readByUser).length,
    [userMessages]
  );

  const incomingRivalRequestCount = useMemo(
    () =>
      rivalries.filter(
        (r) => r.status === 'pending' && r.recipientId === currentUser.id
      ).length,
    [rivalries, currentUser.id]
  );

  const visiblePredictions = useMemo(
    () =>
      predictions.filter(
        (p) =>
          p.published &&
          (p.targetUserId === 'all' || p.targetUserId === currentUser.id)
      ),
    [predictions, currentUser.id]
  );

  const activePredictions = visiblePredictions.filter(
    (p) => !p.expiresAt || p.expiresAt >= todayStr
  );
  const expiredPredictions = visiblePredictions.filter(
    (p) => p.expiresAt && p.expiresAt < todayStr
  );

  const userGuidanceProfile = config.perUserGuidance?.[currentUser.id] || {
    strategicAdvice:
      'Maintain daily preparation discipline and expand your territorial standing.',
    nextObjective:
      'Complete your next active System challenge and maintain your streak.',
  };

  const visibleGuidance = useMemo(
    () => guidance.filter((g) => g.targetUserId === currentUser.id),
    [guidance, currentUser.id]
  );

  const visibleChallenges = useMemo(
    () =>
      challenges.filter(
        (c) => c.targetUserId === 'all' || c.targetUserId === currentUser.id
      ),
    [challenges, currentUser.id]
  );

  const userReports = useMemo(
    () =>
      egoReports
        .filter((r) => r.published && r.targetUserId === currentUser.id)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [egoReports, currentUser.id]
  );

  // Real user performance calculations for Guidance & Challenge verification
  const userStats = useMemo(() => {
    const playerQuizzes = quizzes.filter((q) =>
      q.players.some(
        (p) => p.toLowerCase() === currentUser.fullName.toLowerCase()
      )
    );
    const goldWins = playerQuizzes.filter((q) => q.position === '1st').length;
    const heldTerritories = territories.filter(
      (t) => t.currentHolderUserId === currentUser.id
    );
    return {
      quizCount: playerQuizzes.length,
      goldWins,
      heldTerritoriesCount: heldTerritories.length,
      heldTerritoryNames: heldTerritories.map((t) => t.name),
    };
  }, [quizzes, territories, currentUser]);

  const handleOpenSubTab = (tab: SystemSubTab) => {
    setSubTab(tab);
    if (tab === 'communication' && unreadCount > 0) {
      onMarkMessagesRead(currentUser.id);
    }
  };

  const handleSendChat = (e: FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    onSendMessage(currentUser.id, messageInput.trim());
    setMessageInput('');
  };

  const navCards: {
    id: SystemSubTab;
    label: string;
    desc: string;
    icon: typeof MessageSquare;
  }[] = [
    {
      id: 'communication',
      label: 'Communication',
      desc: 'Talk from the System · Submit inquiries',
      icon: MessageSquare,
    },
    {
      id: 'predictions',
      label: 'Predictions',
      desc: 'What lies ahead? · System forecasts',
      icon: Eye,
    },
    {
      id: 'guidance',
      label: 'Guidance',
      desc: 'Your next direction · Strengths & focus',
      icon: Compass,
    },
    {
      id: 'challenges',
      label: 'Challenges',
      desc: 'Prove your potential · Active tests',
      icon: Target,
    },
    {
      id: 'ego-reports',
      label: 'Ego Reports',
      desc: 'Periodic competitive evaluations',
      icon: FileText,
    },
    {
      id: 'verdict',
      label: 'System Verdict',
      desc: 'Your current competitive identity',
      icon: Fingerprint,
    },
    {
      id: 'rival',
      label: 'Rival',
      desc: 'Friendly competition · Compare stats & timeline',
      icon: Swords,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090B12] text-[#E5E7EB]">
      {/* SYSTEM HEADER BAR */}
      <div className="border-b border-[#3988FF]/25 bg-[#0c101b] px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#3988FF]/50 bg-[#111827] text-[#3988FF] shadow-[0_0_20px_rgba(57,136,255,0.22)]">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-mono text-lg font-bold tracking-[0.2em] text-[#83B9FF]">
                    SYSTEM
                  </h1>
                  <span className="font-mono text-[11px] text-emerald-400">
                    {config.online ? 'ONLINE' : 'STANDBY'}
                  </span>
                </div>
                <p className="text-xs text-[#929CAF]">
                  YOUR PERSONAL INTELLIGENCE INTERFACE · ID:{' '}
                  <span className="text-[#E5E7EB]">{currentUser.fullName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs text-[#929CAF]">
              <span>DATE: {todayStr}</span>
              <button
                type="button"
                onClick={() => handleOpenSubTab('communication')}
                className="relative flex items-center gap-1.5 rounded-lg border border-[#3988FF]/30 bg-[#111827] px-3 py-1.5 text-[#83B9FF] hover:border-[#3988FF] cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>{unreadCount} Unread</span>
              </button>
            </div>
          </div>

          {/* Sub-tab Strip */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleOpenSubTab('overview')}
              className={`rounded-lg border px-3.5 py-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'overview'
                  ? 'border-[#3988FF] bg-[#3988FF]/15 text-[#83B9FF]'
                  : 'border-white/10 bg-[#111827] text-[#929CAF] hover:text-white'
              }`}
            >
              Overview
            </button>
            {navCards.map((c) => {
              const Icon = c.icon;
              const active = subTab === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleOpenSubTab(c.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'border-[#3988FF] bg-[#3988FF]/15 text-[#83B9FF] shadow-[0_0_16px_rgba(57,136,255,0.18)]'
                      : 'border-white/10 bg-[#111827] text-[#929CAF] hover:border-[#3988FF]/40 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{c.label}</span>
                  {c.id === 'rival' && incomingRivalRequestCount > 0 && (
                    <span className="font-mono text-[11px] font-bold text-[#A78BFA] tabular-nums">
                      ({incomingRivalRequestCount})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
        <AnimatePresence mode="wait">
          {/* ================= OVERVIEW LANDING ================= */}
          {subTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Welcome Panel */}
              <div className="rounded-2xl border border-[#3988FF]/45 bg-gradient-to-br from-[#111827] via-[#151D2C] to-[#0c1220] p-7 shadow-[0_0_40px_rgba(57,136,255,0.10)]">
                <p className="font-mono text-xs tracking-[0.22em] text-[#3988FF] uppercase">
                  IDENTIFICATION CONFIRMED
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                  Welcome back, {currentUser.fullName}.
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#929CAF]">
                  {config.welcomeTemplate}
                </p>

                <div className="mt-5 rounded-xl border border-[#83B9FF]/25 bg-[#090B12]/70 p-4">
                  <p className="font-mono text-[11px] font-bold text-[#83B9FF] uppercase">
                    Latest System Directive
                  </p>
                  <p className="mt-1 text-sm text-[#E5E7EB]">
                    {config.globalAnnouncement}
                  </p>
                </div>
              </div>

              {/* 6 Sub-Tab Interactive Navigation Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {navCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <motion.button
                      key={card.id}
                      type="button"
                      whileHover={{ y: -4 }}
                      onClick={() => handleOpenSubTab(card.id)}
                      className="group flex items-start gap-4 rounded-2xl border border-[#3988FF]/25 bg-[#151D2C] p-5 text-left transition-colors hover:border-[#3988FF]/70 cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#3988FF]/35 bg-[#111827] text-[#3988FF] group-hover:text-[#83B9FF]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-mono text-sm font-bold text-white group-hover:text-[#83B9FF]">
                          {card.label}
                        </h3>
                        <p className="mt-1 text-xs text-[#929CAF]">
                          {card.desc}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Overview Summary Cards (4 Modules) */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#A78BFA]/30 bg-[#111827] p-5">
                  <p className="font-mono text-[11px] font-bold text-[#A78BFA] uppercase">
                    Latest Prediction
                  </p>
                  <p className="mt-2 font-semibold text-white">
                    {activePredictions[0]?.title || 'No active projections.'}
                  </p>
                  <p className="mt-1 text-xs text-[#929CAF]">
                    {activePredictions[0]?.preview ||
                      'Awaiting administrative forecast.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#3988FF]/30 bg-[#111827] p-5">
                  <p className="font-mono text-[11px] font-bold text-[#83B9FF] uppercase">
                    Recommended Guidance
                  </p>
                  <p className="mt-2 font-semibold text-white">
                    {visibleGuidance[0]?.title || 'Maintain current discipline.'}
                  </p>
                  <p className="mt-1 text-xs text-[#929CAF]">
                    {visibleGuidance[0]?.recommendedAction ||
                      userGuidanceProfile.nextObjective}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#111827] p-5">
                  <p className="font-mono text-[11px] font-bold text-[#F59E0B] uppercase">
                    Active Challenge
                  </p>
                  <p className="mt-2 font-semibold text-white">
                    {visibleChallenges[0]?.title || 'No active test assigned.'}
                  </p>
                  <p className="mt-1 text-xs text-[#929CAF]">
                    {visibleChallenges[0]?.requirementText ||
                      'Check Challenges tab for updates.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#3988FF]/30 bg-[#111827] p-5">
                  <p className="font-mono text-[11px] font-bold text-[#3988FF] uppercase">
                    Latest Ego Report
                  </p>
                  <p className="mt-2 font-semibold text-white">
                    {userReports[0]?.title || 'No evaluation issued yet.'}
                  </p>
                  <p className="mt-1 text-xs text-[#929CAF]">
                    {userReports[0]?.shortPreview ||
                      'Administration has not filed a cycle evaluation yet.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= 1. COMMUNICATION (ASK THE SYSTEM) ================= */}
          {subTab === 'communication' && (
            <motion.div
              key="comm"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-[#3988FF]/35 bg-[#111827] overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#151D2C] px-6 py-4">
                <div>
                  <h2 className="font-mono text-base font-bold tracking-wider text-[#83B9FF]">
                    SYSTEM COMMUNICATION
                  </h2>
                  <p className="text-xs text-[#929CAF]">
                    Submit your inquiry. The System awaits. (7-day message
                    retention active)
                  </p>
                </div>
                <span className="font-mono text-xs text-emerald-400">
                  TERMINAL: {config.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              {/* Conversation History */}
              <div className="max-h-[420px] space-y-4 overflow-y-auto p-6">
                {/* Initial default greeting if empty */}
                {userMessages.length === 0 && (
                  <div className="max-w-lg rounded-2xl border border-[#3988FF]/35 bg-[#151D2C] p-4">
                    <p className="font-mono text-[10px] font-bold text-[#3988FF] uppercase">
                      SYSTEM
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-line text-[#E5E7EB]">
                      IDENTIFICATION CONFIRMED.{'\n'}What would you like to know,
                      Hunter? Submit your inquiry. The System awaits.
                    </p>
                  </div>
                )}

                {userMessages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-lg rounded-2xl border p-4 ${
                          isUser
                            ? 'border-[#A78BFA]/40 bg-[#1e1b33] text-white'
                            : 'border-[#3988FF]/40 bg-[#151D2C] text-[#E5E7EB]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 font-mono text-[10px]">
                          <span
                            className={
                              isUser ? 'text-[#A78BFA]' : 'text-[#3988FF]'
                            }
                          >
                            {isUser ? currentUser.fullName.toUpperCase() : 'SYSTEM'}
                          </span>
                          <span className="text-[#929CAF]">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line">
                          {msg.text}
                        </p>
                        {isUser && (
                          <p className="mt-1 text-right font-mono text-[10px] text-[#929CAF]">
                            {msg.readByAdmin ? 'Read by Admin' : 'Delivered'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSendChat}
                className="flex gap-3 border-t border-white/10 bg-[#0d121f] p-4"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Ask about ranks, quizzes, territories, or your progression..."
                  className="flex-1 rounded-xl border border-[#3988FF]/30 bg-[#090B12] px-4 py-2.5 text-sm text-white placeholder-[#929CAF] focus:border-[#3988FF] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#3988FF] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#83B9FF] hover:text-[#090B12] cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Transmit</span>
                </button>
              </form>
            </motion.div>
          )}

          {/* ================= 2. PREDICTIONS ================= */}
          {subTab === 'predictions' && (
            <motion.div
              key="pred"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h2 className="font-mono text-2xl font-bold text-[#83B9FF]">
                  SYSTEM PREDICTIONS
                </h2>
                <p className="mt-1 text-xs text-[#929CAF]">
                  The future is uncertain. The System has its projections.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {activePredictions.map((pred) => {
                  const style = getCategoryStyle(pred.category);
                  const Icon = style.icon;
                  return (
                    <motion.button
                      key={pred.id}
                      type="button"
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedPrediction(pred)}
                      style={{ borderColor: `${style.color}55` }}
                      className="flex flex-col justify-between rounded-2xl border bg-[#151D2C] p-5 text-left transition-all hover:bg-[#192336] cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span
                            style={{ color: style.color }}
                            className="font-mono text-[11px] font-bold uppercase"
                          >
                            {pred.category}
                          </span>
                          <Icon
                            style={{ color: style.color }}
                            className="h-4 w-4"
                          />
                        </div>
                        <h3 className="mt-2.5 font-display text-lg font-bold text-white">
                          {pred.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-[#929CAF]">
                          {pred.preview}
                        </p>
                      </div>

                      <div className="mt-5">
                        <div className="flex justify-between font-mono text-[10px] text-[#E5E7EB]">
                          <span>{pred.confidence}</span>
                          <span>{pred.publishedAt}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                          <div
                            style={{
                              width: getConfidenceWidth(pred.confidence),
                              backgroundColor: style.color,
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {expiredPredictions.length > 0 && (
                <div className="border-t border-white/10 pt-6">
                  <h3 className="font-mono text-xs font-bold tracking-wider text-[#929CAF] uppercase">
                    Prediction Archive ({expiredPredictions.length})
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {expiredPredictions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPrediction(p)}
                        className="rounded-xl border border-white/10 bg-[#111827] p-4 text-left opacity-75 hover:opacity-100 cursor-pointer"
                      >
                        <p className="font-mono text-[10px] text-[#929CAF]">
                          {p.category} · Expired {p.expiresAt}
                        </p>
                        <p className="mt-1 font-semibold text-white">
                          {p.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ================= 3. GUIDANCE ================= */}
          {subTab === 'guidance' && (
            <motion.div
              key="guidance"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h2 className="font-mono text-2xl font-bold text-[#83B9FF]">
                  STRATEGIC GUIDANCE
                </h2>
                <p className="mt-1 text-xs text-[#929CAF]">
                  Identify your weaknesses. Refine your approach.
                </p>
              </div>

              {/* Real Data Strengths & Attention */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-[#3988FF]/35 bg-[#151D2C] p-6">
                  <p className="font-mono text-xs font-bold text-[#83B9FF] uppercase">
                    A. Demonstrated Strengths
                  </p>
                  <ul className="mt-4 space-y-2.5 text-sm text-[#E5E7EB]">
                    <li>
                      • Favourite Subject Focus:{' '}
                      <span className="font-semibold text-white">
                        {currentUser.favouriteTopic}
                      </span>
                    </li>
                    <li>
                      • District Quiz Appearances:{' '}
                      <span className="font-mono font-bold text-[#83B9FF]">
                        {userStats.quizCount}
                      </span>{' '}
                      ({userStats.goldWins} Gold finishes)
                    </li>
                    <li>
                      • Active Territories Held:{' '}
                      <span className="font-mono font-bold text-[#83B9FF]">
                        {userStats.heldTerritoriesCount}
                      </span>
                      {userStats.heldTerritoryNames.length > 0
                        ? ` (${userStats.heldTerritoryNames.join(', ')})`
                        : ''}
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#F59E0B]/35 bg-[#151D2C] p-6">
                  <p className="font-mono text-xs font-bold text-[#F59E0B] uppercase">
                    B. Areas Requiring Attention
                  </p>
                  <ul className="mt-4 space-y-2.5 text-sm text-[#E5E7EB]">
                    <li>
                      • Daily Streak Status:{' '}
                      <span className="font-mono font-bold text-[#F59E0B]">
                        {currentUser.streak} days
                      </span>{' '}
                      (Protect continuity daily)
                    </li>
                    <li>
                      • Territory Expansion:{' '}
                      {userStats.heldTerritoriesCount === 0
                        ? 'Zero territories held. Enter Territory #03 to establish footing.'
                        : 'Defend current holdings against challengers preparing higher scores.'}
                    </li>
                    <li>
                      • Cross-Category Coverage: Strengthen weaker non-primary
                      rounds to avoid narrow tie-breaker losses.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Admin Per-User Strategic Advice & Next Objective */}
              <div className="grid gap-5 md:grid-cols-12">
                <div className="rounded-2xl border border-[#A78BFA]/40 bg-[#111827] p-6 md:col-span-7">
                  <p className="font-mono text-xs font-bold text-[#A78BFA] uppercase">
                    D. Personal Strategic Advice · {currentUser.fullName}
                  </p>
                  <p className="mt-3 font-display text-xl italic leading-relaxed text-white">
                    “{userGuidanceProfile.strategicAdvice}”
                  </p>
                </div>
                <div className="rounded-2xl border border-[#3988FF]/45 bg-[#151D2C] p-6 md:col-span-5">
                  <p className="font-mono text-xs font-bold text-[#3988FF] uppercase">
                    E. Next Objective
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#E5E7EB]">
                    {userGuidanceProfile.nextObjective}
                  </p>
                </div>
              </div>

              {/* Recommended Actions (Strictly Personal) */}
              {visibleGuidance.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-8 text-center text-xs text-[#929CAF]">
                  No individual guidance cards issued for {currentUser.fullName}{' '}
                  yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleGuidance.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-2xl border border-white/10 bg-[#111827] p-5"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-[#83B9FF]">{g.category}</span>
                        <span
                          className={
                            g.priority === 'HIGH'
                              ? 'text-[#EF4444]'
                              : g.priority === 'MEDIUM'
                                ? 'text-[#F59E0B]'
                                : 'text-[#929CAF]'
                          }
                        >
                          PRIORITY: {g.priority}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-lg font-bold text-white">
                        {g.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-[#929CAF]">
                        {g.explanation}
                      </p>
                      <p className="mt-3 rounded-lg bg-[#151D2C] p-3 text-xs font-medium text-[#E5E7EB]">
                        Action: {g.recommendedAction}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= 4. CHALLENGES ================= */}
          {subTab === 'challenges' && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-7"
            >
              <div>
                <h2 className="font-mono text-2xl font-bold text-[#83B9FF]">
                  YOUR NEXT TEST
                </h2>
                <p className="mt-1 text-xs text-[#929CAF]">
                  Potential means nothing without proof.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {visibleChallenges.map((chl) => {
                  const completedByUser = chl.completedByUserIds.includes(
                    currentUser.id
                  );
                  const effectiveStatus = completedByUser
                    ? 'COMPLETED'
                    : chl.status;

                  return (
                    <motion.div
                      key={chl.id}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedChallenge(chl)}
                      className="flex cursor-pointer flex-col justify-between rounded-2xl border border-[#3988FF]/30 bg-[#151D2C] p-5 transition-colors hover:border-[#83B9FF]"
                    >
                      <div>
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="text-[#A78BFA]">
                            {chl.category} · {chl.difficulty}
                          </span>
                          <span
                            className={
                              effectiveStatus === 'COMPLETED'
                                ? 'text-emerald-400'
                                : effectiveStatus === 'EXPIRED'
                                  ? 'text-[#EF4444]'
                                  : 'text-[#83B9FF]'
                            }
                          >
                            {effectiveStatus}
                          </span>
                        </div>
                        <h3 className="mt-2.5 font-display text-lg font-bold text-white">
                          {chl.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-[#929CAF]">
                          {chl.description}
                        </p>
                      </div>

                      <div className="mt-5 border-t border-white/10 pt-3 font-mono text-xs">
                        <div className="flex justify-between text-[#83B9FF]">
                          <span>Reward: +{chl.rewardXp} XP</span>
                          <span>Due: {chl.deadline}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ================= 5. EGO REPORTS ================= */}
          {subTab === 'ego-reports' && (
            <motion.div
              key="ego"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-7"
            >
              <div>
                <h2 className="font-mono text-2xl font-bold text-[#83B9FF]">
                  EGO EVALUATION
                </h2>
                <p className="mt-1 text-xs text-[#929CAF]">
                  An assessment of your competitive identity. Confidential to{' '}
                  {currentUser.fullName}.
                </p>
              </div>

              {userReports.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-12 text-center text-sm text-[#929CAF]">
                  No Ego Evaluation reports have been filed for you yet.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {userReports.map((rep) => (
                    <motion.button
                      key={rep.id}
                      type="button"
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedReport(rep)}
                      className="rounded-2xl border border-[#3988FF]/35 bg-[#151D2C] p-6 text-left transition-colors hover:border-[#3988FF] cursor-pointer"
                    >
                      <div className="flex items-center justify-between font-mono text-xs text-[#3988FF]">
                        <span>{rep.reportNumber}</span>
                        <span className="text-[#929CAF]">{rep.publishedAt}</span>
                      </div>
                      <h3 className="mt-2 font-display text-xl font-bold text-white">
                        {rep.title}
                      </h3>
                      <p className="mt-1 font-mono text-[11px] text-[#A78BFA]">
                        Period: {rep.period}
                      </p>
                      <p className="mt-3 text-xs leading-relaxed text-[#929CAF]">
                        {rep.shortPreview}
                      </p>
                      <p className="mt-4 font-mono text-xs font-bold text-[#83B9FF]">
                        Open Confidential Report →
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= 6. SYSTEM VERDICT ================= */}
          {subTab === 'verdict' && (
            <motion.div
              key="verdict"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-mono text-2xl font-bold text-[#83B9FF]">
                  COMPETITIVE IDENTITY
                </h2>
                <p className="mt-1 text-xs text-[#929CAF]">
                  Your performance defines your standing. Separate from official
                  DQR Grades.
                </p>
              </div>

              {!verdict ? (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-10 text-center text-sm text-[#929CAF]">
                  No System Verdict has been assigned to your profile yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Main Classification Panel */}
                  <div className="rounded-3xl border border-[#3988FF]/50 bg-gradient-to-br from-[#111827] via-[#151D2C] to-[#0c1220] p-8 shadow-[0_0_50px_rgba(57,136,255,0.14)]">
                    <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                      <span className="text-[#83B9FF]">
                        STATUS: {verdict.status}
                      </span>
                      <span className="text-[#929CAF]">
                        ASSIGNED: {verdict.assignedDate}
                      </span>
                    </div>

                    <h3 className="mt-4 font-mono text-3xl font-extrabold tracking-widest text-white sm:text-5xl">
                      {verdict.classification}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#E5E7EB]">
                      {verdict.description}
                    </p>
                  </div>

                  {/* A–D Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      {
                        label: 'A. Performance Characteristics',
                        val: verdict.performanceCharacteristics,
                        accent: '#3988FF',
                      },
                      {
                        label: 'B. Strongest Attribute',
                        val: verdict.strongestAttribute,
                        accent: '#83B9FF',
                      },
                      {
                        label: 'C. Biggest Weakness',
                        val: verdict.biggestWeakness,
                        accent: '#F59E0B',
                      },
                      {
                        label: 'D. Competitive Tendencies',
                        val: verdict.competitiveTendencies,
                        accent: '#A78BFA',
                      },
                    ].map((block) => (
                      <div
                        key={block.label}
                        className="rounded-2xl border border-white/10 bg-[#111827] p-5"
                      >
                        <p
                          style={{ color: block.accent }}
                          className="font-mono text-xs font-bold uppercase"
                        >
                          {block.label}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[#E5E7EB]">
                          {block.val}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* E. Previous Classifications */}
                  <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
                    <p className="font-mono text-xs font-bold text-[#929CAF] uppercase">
                      E. Classification History
                    </p>
                    <div className="mt-3 space-y-2">
                      {verdict.history.map((h, i) => (
                        <div
                          key={`${h.classification}-${i}`}
                          className="flex justify-between rounded-lg bg-[#151D2C] px-4 py-2.5 font-mono text-xs"
                        >
                          <span className="font-bold text-white">
                            {h.classification}
                          </span>
                          <span className="text-[#929CAF]">
                            {h.assignedDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {/* ================= 7. RIVAL ================= */}
          {subTab === 'rival' && (
            <RivalPanel
              currentUser={currentUser}
              users={users}
              ranks={ranks}
              territories={territories}
              challenges={challenges}
              rivalries={rivalries}
              onSendRivalRequest={onSendRivalRequest}
              onRespondRivalRequest={onRespondRivalRequest}
              onCancelRivalRequest={onCancelRivalRequest}
              onEndRivalry={onEndRivalry}
            />
          )}
        </AnimatePresence>

        {/* System Closing Motto */}
        <p className="mt-14 border-t border-white/10 pt-6 text-center font-mono text-xs tracking-[0.22em] text-[#929CAF]">
          THE SYSTEM OBSERVES. THE SYSTEM EVALUATES. THE USER PROVES.
        </p>
      </div>

      {/* PREDICTION DETAIL MODAL */}
      <AnimatePresence>
        {selectedPrediction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPrediction(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-[#3988FF]/50 bg-[#111827] p-6 text-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-bold text-[#83B9FF]">
                    {selectedPrediction.category} ·{' '}
                    {selectedPrediction.confidence}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold">
                    {selectedPrediction.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPrediction(null)}
                  className="rounded-lg p-1 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#E5E7EB]">
                {selectedPrediction.fullText}
              </p>
              <p className="mt-4 font-mono text-xs text-[#929CAF]">
                Published: {selectedPrediction.publishedAt}
                {selectedPrediction.expiresAt
                  ? ` · Expires: ${selectedPrediction.expiresAt}`
                  : ''}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHALLENGE DETAIL MODAL */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedChallenge(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-[#3988FF]/50 bg-[#111827] p-6 text-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-bold text-[#A78BFA]">
                    {selectedChallenge.category} ·{' '}
                    {selectedChallenge.difficulty}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold">
                    {selectedChallenge.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChallenge(null)}
                  className="rounded-lg p-1 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-3 text-sm text-[#E5E7EB]">
                {selectedChallenge.description}
              </p>

              <div className="mt-4 space-y-2 rounded-xl bg-[#090B12] p-4 font-mono text-xs">
                <p>Requirement: {selectedChallenge.requirementText}</p>
                <p className="text-[#83B9FF]">
                  Reward: +{selectedChallenge.rewardXp} XP
                </p>
                <p className="text-[#929CAF]">
                  Deadline: {selectedChallenge.deadline}
                </p>
              </div>

              {!selectedChallenge.completedByUserIds.includes(
                currentUser.id
              ) &&
                selectedChallenge.status !== 'EXPIRED' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClaimChallenge(selectedChallenge.id, currentUser.id);
                      setSelectedChallenge(null);
                    }}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3988FF] py-2.5 text-xs font-bold text-white hover:bg-[#83B9FF] hover:text-[#090B12] cursor-pointer"
                  >
                    <Award className="h-4 w-4" />
                    <span>Verify & Claim Reward</span>
                  </button>
                )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL EGO REPORT MODAL */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReport(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#3988FF]/55 bg-[#0e1422] p-6 text-white sm:p-8"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="font-mono text-xs font-bold text-[#3988FF]">
                    CONFIDENTIAL DOSSIER · {selectedReport.reportNumber}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold">
                    {selectedReport.title}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-[#929CAF]">
                    {selectedReport.period} · Issued {selectedReport.publishedAt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg p-1.5 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  {
                    heading: 'A. Overall Assessment',
                    body: selectedReport.overallAssessment,
                  },
                  { heading: 'B. Strengths', body: selectedReport.strengths },
                  { heading: 'C. Weaknesses', body: selectedReport.weaknesses },
                  {
                    heading: 'D. Competitive Standing',
                    body: selectedReport.competitiveStanding,
                  },
                  {
                    heading: 'E. Progression',
                    body: selectedReport.progression,
                  },
                ].map((sec) => (
                  <div
                    key={sec.heading}
                    className="rounded-xl border border-white/10 bg-[#111827] p-4"
                  >
                    <p className="font-mono text-xs font-bold text-[#83B9FF] uppercase">
                      {sec.heading}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#E5E7EB]">
                      {sec.body}
                    </p>
                  </div>
                ))}

                <div className="rounded-xl border border-[#3988FF]/60 bg-[#151D2C] p-5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#3988FF] uppercase">
                    <ShieldAlert className="h-4 w-4" />
                    <span>F. Final Verdict</span>
                  </div>
                  <p className="mt-2 font-mono text-sm font-bold leading-relaxed text-white">
                    {selectedReport.finalVerdict}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
