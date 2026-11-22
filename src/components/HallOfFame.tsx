import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Crown,
  FilterX,
  Image as ImageIcon,
  Layers,
  MapPin,
  Search,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  GalleryPhoto,
  HofSubTab,
  QuizPosition,
  QuizRecord,
} from '../types';
import {
  POSITION_OPTIONS,
  POSITION_POINTS,
  StandingsSortMode,
  compareDFirst,
  computeStandings,
} from '../data/initialData';
import {
  FirstGoldCrown,
  PositionCrownOrEmblem,
  SecondSilverCrown,
  ThirdBronzeCrown,
} from './Crowns';

interface HallOfFameProps {
  bsYears: string[];
  quizzes: QuizRecord[];
  gallery: GalleryPhoto[];
}

interface LightboxState {
  photos: { url: string; title: string; subtitle: string }[];
  index: number;
}

export function HallOfFame({ bsYears, quizzes, gallery }: HallOfFameProps) {
  const [subTab, setSubTab] = useState<HofSubTab>('standings');
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // Standings filters
  const [standingsYear, setStandingsYear] = useState<string>('all');
  const [standingsSort, setStandingsSort] =
    useState<StandingsSortMode>('points');

  // External Wins filters
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterPosition, setFilterPosition] = useState<string>('');
  const [filterHost, setFilterHost] = useState<string>('');
  const [filterPlayer, setFilterPlayer] = useState<string>('');
  const [selectedQuiz, setSelectedQuiz] = useState<QuizRecord | null>(null);

  // Squad Synergy filters
  const [synergyYear, setSynergyYear] = useState<string>('all');
  const [synergySearch, setSynergySearch] = useState<string>('');
  const [synergySort, setSynergySort] = useState<
    'podiums' | 'first' | 'second' | 'third' | 'points' | 'qual-rate'
  >('podiums');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightbox) setLightbox(null);
        else if (selectedQuiz) setSelectedQuiz(null);
      }
      if (lightbox && e.key === 'ArrowRight') {
        setLightbox((prev) =>
          prev
            ? { ...prev, index: (prev.index + 1) % prev.photos.length }
            : null
        );
      }
      if (lightbox && e.key === 'ArrowLeft') {
        setLightbox((prev) =>
          prev
            ? {
                ...prev,
                index:
                  (prev.index - 1 + prev.photos.length) % prev.photos.length,
              }
            : null
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightbox, selectedQuiz]);

  const computeAwardsForFilter = (yearFilter: string) => {
    const base = computeStandings(quizzes, yearFilter, 'points');
    if (base.length === 0) return null;

    const mostFirst = [...base].sort(
      (a, b) => b.first - a.first || b.points - a.points
    )[0];

    const eligibleQual = base.some((r) => r.totalQuizzes >= 2)
      ? base.filter((r) => r.totalQuizzes >= 2)
      : base;
    const bestQual = [...eligibleQual].sort((a, b) => {
      const rateA = a.totalQuizzes > 0 ? a.qualified / a.totalQuizzes : 0;
      const rateB = b.totalQuizzes > 0 ? b.qualified / b.totalQuizzes : 0;
      if (rateB !== rateA) return rateB - rateA;
      return b.qualified - a.qualified || b.points - a.points;
    })[0];

    const mostPodiums = [...base].sort((a, b) => {
      const podA = a.first + a.second + a.third;
      const podB = b.first + b.second + b.third;
      if (podB !== podA) return podB - podA;
      return b.points - a.points;
    })[0];

    return { mostFirst, bestQual, mostPodiums };
  };

  const seasonAwards = useMemo(
    () => computeAwardsForFilter(standingsYear),
    [quizzes, standingsYear]
  );

  const awardBonusMap = useMemo(() => {
    const map = new Map<string, number>();
    const grantAwards = (awards: ReturnType<typeof computeAwardsForFilter>) => {
      if (!awards) return;
      const grant = (player: string) =>
        map.set(player, (map.get(player) || 0) + 3);
      grant(awards.mostFirst.player);
      grant(awards.bestQual.player);
      grant(awards.mostPodiums.player);
    };

    if (standingsYear === 'all') {
      grantAwards(seasonAwards);
      const allYears = Array.from(
        new Set([...bsYears, ...quizzes.map((q) => q.yearBS).filter(Boolean)])
      );
      for (const yr of allYears) {
        grantAwards(computeAwardsForFilter(yr));
      }
    } else {
      grantAwards(seasonAwards);
    }

    return map;
  }, [quizzes, bsYears, standingsYear, seasonAwards]);

  const standings = useMemo(() => {
    const base = computeStandings(quizzes, standingsYear, standingsSort);
    if (awardBonusMap.size === 0) return base;

    const withBonus = base.map((row) => ({
      ...row,
      points: row.points + (awardBonusMap.get(row.player) || 0),
    }));

    if (standingsSort === 'points') {
      withBonus.sort(
        (a, b) =>
          b.points - a.points ||
          a.earliestDate - b.earliestDate ||
          compareDFirst(a.player, b.player)
      );
    }

    return withBonus;
  }, [quizzes, standingsYear, standingsSort, awardBonusMap]);

  const synergyRows = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        playerA: string;
        playerB: string;
        first: number;
        second: number;
        third: number;
        podiums: number;
        totalQuizzes: number;
        qualified: number;
        points: number;
      }
    >();

    for (const q of quizzes) {
      if (synergyYear !== 'all' && q.yearBS !== synergyYear) continue;
      const uniqueClean = Array.from(
        new Set(q.players.map((p) => p.trim()).filter(Boolean))
      );
      if (uniqueClean.length < 2) continue;

      const pts = POSITION_POINTS[q.position] ?? 0;
      const isQual = q.position !== 'Not Qualified';

      for (let i = 0; i < uniqueClean.length; i++) {
        for (let j = i + 1; j < uniqueClean.length; j++) {
          const [playerA, playerB] = [uniqueClean[i], uniqueClean[j]].sort(
            (a, b) => a.localeCompare(b)
          );
          const key = `${playerA.toLowerCase()}__${playerB.toLowerCase()}`;
          if (!map.has(key)) {
            map.set(key, {
              key,
              playerA,
              playerB,
              first: 0,
              second: 0,
              third: 0,
              podiums: 0,
              totalQuizzes: 0,
              qualified: 0,
              points: 0,
            });
          }
          const row = map.get(key)!;
          row.totalQuizzes += 1;
          row.points += pts;
          if (isQual) row.qualified += 1;
          if (q.position === '1st') row.first += 1;
          else if (q.position === '2nd') row.second += 1;
          else if (q.position === '3rd') row.third += 1;
          row.podiums = row.first + row.second + row.third;
        }
      }
    }

    const qSearch = synergySearch.trim().toLowerCase();
    const list = Array.from(map.values())
      .map((r) => ({
        ...r,
        qualRate:
          r.totalQuizzes > 0
            ? Math.round((r.qualified / r.totalQuizzes) * 100)
            : 0,
      }))
      .filter((r) => {
        if (!qSearch) return true;
        return (
          r.playerA.toLowerCase().includes(qSearch) ||
          r.playerB.toLowerCase().includes(qSearch)
        );
      });

    list.sort((a, b) => {
      switch (synergySort) {
        case 'first':
          return b.first - a.first || b.podiums - a.podiums || b.points - a.points;
        case 'second':
          return b.second - a.second || b.podiums - a.podiums || b.points - a.points;
        case 'third':
          return b.third - a.third || b.podiums - a.podiums || b.points - a.points;
        case 'points':
          return b.points - a.points || b.podiums - a.podiums;
        case 'qual-rate':
          return b.qualRate - a.qualRate || b.qualified - a.qualified || b.points - a.points;
        case 'podiums':
        default:
          return (
            b.podiums - a.podiums ||
            b.first - a.first ||
            b.second - a.second ||
            b.third - a.third ||
            b.points - a.points
          );
      }
    });

    return list;
  }, [quizzes, synergyYear, synergySearch, synergySort]);

  const podiumTop3 = standings.slice(0, 3);

  const uniqueHosts = useMemo(
    () => Array.from(new Set(quizzes.map((q) => q.host).filter(Boolean))).sort(),
    [quizzes]
  );

  const uniquePlayers = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => q.players.forEach((p) => set.add(p.trim())));
    return Array.from(set).filter(Boolean).sort();
  }, [quizzes]);

  const hasAnyFilter = Boolean(
    filterYear || filterPosition || filterHost || filterPlayer
  );

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      if (filterYear && q.yearBS !== filterYear) return false;
      if (filterPosition && q.position !== filterPosition) return false;
      if (filterHost && q.host !== filterHost) return false;
      if (
        filterPlayer &&
        !q.players.some((p) => p.toLowerCase() === filterPlayer.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [quizzes, filterYear, filterPosition, filterHost, filterPlayer]);

  const groupedGallery = useMemo(() => {
    const map = new Map<
      string,
      { quizName: string; yearBS: string; host: string; items: GalleryPhoto[] }
    >();
    const seenUrlsByGroup = new Map<string, Set<string>>();

    const ensureGroup = (quizName: string, yearBS: string, host: string) => {
      const key = `${yearBS}__${quizName}`;
      if (!map.has(key)) {
        map.set(key, {
          quizName,
          yearBS,
          host,
          items: [],
        });
        seenUrlsByGroup.set(key, new Set());
      }
      return { key, group: map.get(key)!, seen: seenUrlsByGroup.get(key)! };
    };

    for (const item of gallery) {
      const { group, seen } = ensureGroup(
        item.quizName,
        item.yearBS,
        item.host
      );
      if (!seen.has(item.imageUrl)) {
        seen.add(item.imageUrl);
        group.items.push(item);
      }
    }

    for (const quiz of quizzes) {
      if (!quiz.photos || quiz.photos.length === 0) continue;
      const { group, seen } = ensureGroup(
        quiz.quizName,
        quiz.yearBS,
        quiz.host
      );
      const posLabel =
        quiz.position === 'Not Qualified'
          ? 'Participation'
          : `${quiz.position} Place`;
      const playersLabel =
        quiz.players.length > 0 ? quiz.players.join(', ') : '';
      const caption = [posLabel, playersLabel, quiz.extraNote]
        .filter(Boolean)
        .join(' · ');

      quiz.photos.forEach((url, idx) => {
        if (!url || seen.has(url)) return;
        seen.add(url);
        group.items.push({
          id: `quiz-photo-${quiz.id}-${idx}`,
          quizName: quiz.quizName,
          yearBS: quiz.yearBS,
          host: quiz.host,
          caption,
          imageUrl: url,
        });
      });
    }

    return Array.from(map.values()).sort((a, b) =>
      b.yearBS.localeCompare(a.yearBS)
    );
  }, [gallery, quizzes]);

  const clearAllFilters = () => {
    setFilterYear('');
    setFilterPosition('');
    setFilterHost('');
    setFilterPlayer('');
  };

  const getQuizCardTheme = (position: QuizPosition) => {
    switch (position) {
      case '1st':
        return {
          wrapper:
            'border-[#d4af37]/70 bg-gradient-to-br from-[#1b1608] via-[#0c1c34] to-[#0a1f3a] shadow-[0_14px_40px_rgba(212,175,55,0.22)] hover:border-[#f5dc82] hover:shadow-[0_22px_56px_rgba(212,175,55,0.38)]',
          labelColor: 'text-[#f8e6a0]',
          aura: 'bg-[radial-gradient(circle_at_50%_20%,rgba(245,220,130,0.24),transparent_65%)]',
        };
      case '2nd':
        return {
          wrapper:
            'border-slate-300/50 bg-gradient-to-br from-[#162235] via-[#0d223f] to-[#0a1f3a] shadow-[0_14px_36px_rgba(203,213,225,0.14)] hover:border-slate-200/85 hover:shadow-[0_20px_50px_rgba(226,232,240,0.26)]',
          labelColor: 'text-slate-200',
          aura: 'bg-[radial-gradient(circle_at_50%_20%,rgba(226,232,240,0.18),transparent_65%)]',
        };
      case '3rd':
        return {
          wrapper:
            'border-[#b86b35]/60 bg-gradient-to-br from-[#23150d] via-[#122038] to-[#0a1f3a] shadow-[0_14px_36px_rgba(184,107,53,0.18)] hover:border-[#e69f66] hover:shadow-[0_20px_50px_rgba(184,107,53,0.32)]',
          labelColor: 'text-[#f5c08D]',
          aura: 'bg-[radial-gradient(circle_at_50%_20%,rgba(184,107,53,0.24),transparent_65%)]',
        };
      case 'Not Qualified':
        return {
          wrapper:
            'border-white/15 bg-gradient-to-br from-[#0e223d] to-[#08172b] hover:border-white/40',
          labelColor: 'text-slate-300',
          aura: 'bg-[radial-gradient(circle_at_50%_20%,rgba(148,163,184,0.10),transparent_65%)]',
        };
      default:
        return {
          wrapper:
            'border-[#d4af37]/30 bg-gradient-to-br from-[#10294b] to-[#0a1f3a] hover:border-[#d4af37]/70',
          labelColor: 'text-[#e9cf7c]',
          aura: 'bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.14),transparent_65%)]',
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f3a] text-white">
      {/* Hall of Fame Architectural Header Banner */}
      <div className="border-b border-[#d4af37]/25 bg-gradient-to-b from-[#07162b] to-[#0a1f3a] px-5 pt-10 pb-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
            >
              <p className="font-mono text-xs tracking-[0.22em] text-[#d4af37] uppercase">
                District Academic Archive
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Hall of Fame
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#f5f5f0]/80 sm:text-base">
                Permanent record of district-level quiz performances, podium
                honors, and competition photography across Bikram Sambat years.
              </p>
            </motion.div>

            {/* Sub-tab Segmented Controls */}
            <div
              role="tablist"
              aria-label="Hall of Fame sections"
              className="inline-flex flex-wrap gap-1 rounded-xl border border-[#7c4d2b]/60 bg-[#071528] p-1.5 shadow-inner"
            >
              {(
                [
                  { id: 'gallery', label: 'Gallery' },
                  { id: 'standings', label: 'Standings' },
                  { id: 'external-wins', label: 'External Wins' },
                  { id: 'synergy', label: 'Squad Synergy' },
                ] as const
              ).map((tab) => {
                const active = subTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setSubTab(tab.id)}
                    className={`relative rounded-lg px-4 py-2 text-xs font-semibold transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer sm:text-sm ${
                      active
                        ? 'text-[#081324]'
                        : 'text-[#f5f5f0]/75 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="hof-subtab-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#e9c85b] shadow-[0_4px_16px_rgba(212,175,55,0.35)]"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <AnimatePresence mode="wait">
          {/* ================= 1. GALLERY SUB-TAB ================= */}
          {subTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12"
            >
              {groupedGallery.length === 0 ? (
                <div className="rounded-2xl border border-[#7c4d2b]/40 bg-[#f5f5f0] p-12 text-center text-[#0a1f3a]">
                  <ImageIcon className="mx-auto h-10 w-10 text-[#7c4d2b]" />
                  <h3 className="mt-3 font-display text-xl font-bold">
                    No Gallery Photographs Yet
                  </h3>
                  <p className="mt-1 text-sm text-[#0a1f3a]/70">
                    Administrators can add past district quiz photos from the
                    Admin Panel.
                  </p>
                </div>
              ) : (
                groupedGallery.map((group, gIdx) => (
                  <motion.section
                    key={`${group.yearBS}-${group.quizName}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gIdx * 0.08 }}
                    className="rounded-2xl border border-[#7c4d2b]/50 bg-[#f5f5f0] p-6 text-[#0a1f3a] shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-8"
                  >
                    <div className="flex flex-col justify-between gap-2 border-b border-[#7c4d2b]/20 pb-4 sm:flex-row sm:items-end">
                      <div>
                        <p className="font-mono text-xs font-semibold tracking-wider text-[#7c4d2b]">
                          {group.yearBS} B.S. · {group.host}
                        </p>
                        <h2 className="mt-1 font-display text-2xl font-bold text-[#0a1f3a]">
                          {group.quizName}
                        </h2>
                      </div>
                      <span className="text-xs font-medium text-[#7c4d2b]">
                        {group.items.length}{' '}
                        {group.items.length === 1 ? 'Photograph' : 'Photographs'}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((photo, pIdx) => (
                        <motion.button
                          key={photo.id}
                          type="button"
                          whileHover={{ y: -5, scale: 1.01 }}
                          onClick={() =>
                            setLightbox({
                              photos: group.items.map((i) => ({
                                url: i.imageUrl,
                                title: i.quizName,
                                subtitle: `${i.yearBS} B.S. · ${i.caption}`,
                              })),
                              index: pIdx,
                            })
                          }
                          className="group relative overflow-hidden rounded-xl border-4 border-[#6c4123] bg-[#0a1f3a] text-left shadow-md transition-shadow hover:shadow-xl cursor-pointer"
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden bg-[#0a1f3a]">
                            <img
                              src={photo.imageUrl}
                              alt={photo.caption || photo.quizName}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-85 transition-opacity group-hover:opacity-100" />
                          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-[#f5dc82] opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                            <ZoomIn className="h-4 w-4" />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 p-4">
                            <p className="line-clamp-2 text-xs leading-snug font-medium text-[#f5f5f0]">
                              {photo.caption}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.section>
                ))
              )}
            </motion.div>
          )}

          {/* ================= 2. STANDINGS SUB-TAB (CLEAN, UNCONGESTED GOLD & BLACK TROPHY) ================= */}
          {subTab === 'standings' && (
            <motion.div
              key="standings"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-[#d4af37]/40 bg-[#08080a] p-6 text-[#f5f2eb] shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-10"
            >
              {/* Header & Filters */}
              <div className="flex flex-col justify-between gap-5 border-b border-[#d4af37]/20 pb-7 lg:flex-row lg:items-end">
                <div>
                  <p className="font-mono text-xs tracking-[0.2em] text-[#d4af37] uppercase">
                    Championship Leaderboard
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl font-bold text-[#f8e6a0] sm:text-3xl">
                    District Standings
                  </h2>
                  <p className="mt-1.5 text-xs text-neutral-400">
                    Ranked by Points, then oldest 1st quiz played, then D-first
                    alphabetical order · 1st (6) · 2nd (5) · 3rd (4) · 4th (3) ·
                    5th (2) · 6th (1) · NQ (0) · +3 pts per Season &amp; All-Time Honor
                  </p>
                </div>

                {/* Standings Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    aria-label="Filter standings by year"
                    value={standingsYear}
                    onChange={(e) => setStandingsYear(e.target.value)}
                    className="rounded-xl border border-[#d4af37]/40 bg-[#12110d] px-3.5 py-2.5 font-mono text-xs font-semibold text-[#f8e6a0] focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All B.S. Years</option>
                    {bsYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} B.S.
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Sort standings by category"
                    value={standingsSort}
                    onChange={(e) =>
                      setStandingsSort(e.target.value as StandingsSortMode)
                    }
                    className="rounded-xl border border-[#d4af37]/40 bg-[#12110d] px-3.5 py-2.5 text-xs font-semibold text-[#f8e6a0] focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="points">Sort: Highest Points</option>
                    <option value="most-1st">Filter: Most 1st</option>
                    <option value="most-2nd">Filter: Most 2nd</option>
                    <option value="most-3rd">Filter: Most 3rd</option>
                    <option value="most-4th">Filter: Most 4th</option>
                    <option value="most-5th">Filter: Most 5th</option>
                    <option value="most-6th">Filter: Most 6th</option>
                    <option value="most-quizzes">
                      Filter: Most Quizzes Played
                    </option>
                  </select>
                </div>
              </div>

              {/* SEASON AWARDS & TITLES (+3 pts each) */}
              {seasonAwards && (
                <div className="mt-7 grid gap-4 md:grid-cols-3">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-br from-[#191409] to-[#0d0c09] p-4 shadow-[0_12px_30px_rgba(212,175,55,0.08)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold tracking-widest text-[#d4af37] uppercase">
                        Gold Sovereign · {standingsYear === 'all' ? 'All-Time' : `${standingsYear} B.S.`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-[#fde68a]">
                          +3 pts
                        </span>
                        <Crown className="h-4 w-4 text-[#f5dc82]" />
                      </div>
                    </div>
                    <p className="mt-2 truncate font-display text-lg font-bold text-[#f8e6a0]">
                      {seasonAwards.mostFirst.player}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-neutral-300">
                      {seasonAwards.mostFirst.first} × 1st Place · +3 Bonus Pts
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.35, delay: 0.06 }}
                    className="rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-[#0b1b16] to-[#0b0e0d] p-4 shadow-[0_12px_30px_rgba(16,185,129,0.08)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold tracking-widest text-emerald-300 uppercase">
                        Clutch Qualifier
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-emerald-200">
                          +3 pts
                        </span>
                        <Award className="h-4 w-4 text-emerald-300" />
                      </div>
                    </div>
                    <p className="mt-2 truncate font-display text-lg font-bold text-white">
                      {seasonAwards.bestQual.player}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-emerald-200/90">
                      {seasonAwards.bestQual.totalQuizzes > 0
                        ? `${Math.round(
                            (seasonAwards.bestQual.qualified /
                              seasonAwards.bestQual.totalQuizzes) *
                              100
                          )}% Qual (${seasonAwards.bestQual.qualified}/${seasonAwards.bestQual.totalQuizzes}) · +3 Bonus`
                        : '—'}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.35, delay: 0.12 }}
                    className="rounded-2xl border border-slate-300/35 bg-gradient-to-br from-[#131822] to-[#0b0d11] p-4 shadow-[0_12px_30px_rgba(203,213,225,0.06)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold tracking-widest text-slate-300 uppercase">
                        Podium Regularity
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-200">
                          +3 pts
                        </span>
                        <Sparkles className="h-4 w-4 text-slate-200" />
                      </div>
                    </div>
                    <p className="mt-2 truncate font-display text-lg font-bold text-slate-100">
                      {seasonAwards.mostPodiums.player}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-300">
                      {seasonAwards.mostPodiums.first +
                        seasonAwards.mostPodiums.second +
                        seasonAwards.mostPodiums.third}{' '}
                      Top-3 ({seasonAwards.mostPodiums.first}G ·{' '}
                      {seasonAwards.mostPodiums.second}S ·{' '}
                      {seasonAwards.mostPodiums.third}B) · +3 Bonus
                    </p>
                  </motion.div>
                </div>
              )}

              {/* MID-SIZED PODIUM FOR 1st, 2nd, 3rd */}
              {podiumTop3.length > 0 && (
                <div className="mt-9 pb-8">
                  <div className="mx-auto grid max-w-3xl grid-cols-3 items-end gap-4 sm:gap-7">
                    {/* 2nd Place (Silver Pillar) */}
                    {podiumTop3[1] ? (
                      <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.55, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -5 }}
                        className="flex flex-col items-center text-center"
                      >
                        <SecondSilverCrown className="h-11 w-11 sm:h-12 sm:w-12" />
                        <p className="mt-2 max-w-full truncate font-display text-sm font-bold text-slate-100 sm:text-base">
                          {podiumTop3[1].player}
                        </p>
                        <p className="font-mono text-xs text-slate-300 tabular-nums">
                          {podiumTop3[1].points} pts
                        </p>
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            duration: 0.65,
                            delay: 0.22,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{ transformOrigin: 'bottom' }}
                          className="sheen-hover mt-3 flex h-24 w-full flex-col items-center justify-center rounded-t-2xl border border-b-0 border-slate-300/50 bg-gradient-to-b from-slate-300/25 via-slate-500/15 to-[#0d0d10] px-2 sm:h-28"
                        >
                          <span className="font-display text-xl font-extrabold text-slate-200 sm:text-2xl">
                            2nd
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {podiumTop3[1].qualified}/{podiumTop3[1].totalQuizzes}{' '}
                            Qual.
                          </span>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div />
                    )}

                    {/* 1st Place (Tall Golden Pillar) */}
                    {podiumTop3[0] && (
                      <motion.div
                        initial={{ opacity: 0, y: 36 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -6 }}
                        className="flex flex-col items-center text-center"
                      >
                        <FirstGoldCrown className="h-12 w-12 sm:h-14 sm:w-14" />
                        <p className="mt-2 max-w-full truncate font-display text-base font-bold text-[#f8e6a0] sm:text-lg">
                          {podiumTop3[0].player}
                        </p>
                        <p className="font-mono text-xs font-semibold text-[#d4af37] tabular-nums">
                          {podiumTop3[0].points} pts
                        </p>
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            duration: 0.78,
                            delay: 0.12,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{ transformOrigin: 'bottom' }}
                          className="sheen-hover mt-3 flex h-32 w-full flex-col items-center justify-center rounded-t-2xl border border-b-0 border-[#f5dc82]/75 bg-gradient-to-b from-[#f0cb65]/45 via-[#b8861b]/25 to-[#120f08] px-2 shadow-[0_-12px_36px_rgba(212,175,55,0.3)] sm:h-36"
                        >
                          <span className="font-display text-2xl font-extrabold text-[#fff2b8] sm:text-3xl">
                            1st
                          </span>
                          <span className="font-mono text-[11px] text-[#f5dc82]">
                            {podiumTop3[0].qualified}/{podiumTop3[0].totalQuizzes}{' '}
                            Qual.
                          </span>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* 3rd Place (Bronze / Warm Wood Pillar) */}
                    {podiumTop3[2] ? (
                      <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.55, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -5 }}
                        className="flex flex-col items-center text-center"
                      >
                        <ThirdBronzeCrown className="h-10 w-10 sm:h-11 sm:w-11" />
                        <p className="mt-2 max-w-full truncate font-display text-sm font-bold text-[#f5c08D] sm:text-base">
                          {podiumTop3[2].player}
                        </p>
                        <p className="font-mono text-xs text-[#d69560] tabular-nums">
                          {podiumTop3[2].points} pts
                        </p>
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            duration: 0.6,
                            delay: 0.32,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{ transformOrigin: 'bottom' }}
                          className="sheen-hover mt-3 flex h-20 w-full flex-col items-center justify-center rounded-t-2xl border border-b-0 border-[#b86b35]/60 bg-gradient-to-b from-[#b86b35]/30 via-[#6c3c1b]/20 to-[#110c09] px-2 sm:h-24"
                        >
                          <span className="font-display text-lg font-extrabold text-[#f5c08D] sm:text-xl">
                            3rd
                          </span>
                          <span className="font-mono text-[11px] text-[#d69560]">
                            {podiumTop3[2].qualified}/{podiumTop3[2].totalQuizzes}{' '}
                            Qual.
                          </span>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              )}

              {/* SPACIOUS, UNCONGESTED GOLD & BLACK STANDINGS TABLE */}
              {standings.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-[#d4af37]/20 bg-[#11100d] p-10 text-center">
                  <Trophy className="mx-auto h-9 w-9 text-[#d4af37]/60" />
                  <p className="mt-3 text-sm text-neutral-300">
                    No quiz records found for this filter.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table: Position | Player Name | 1st..6th | Total Quizzes | Qualified | Points */}
                  <div className="mt-4 hidden overflow-hidden rounded-2xl border border-[#d4af37]/35 bg-[#0d0c09] md:block">
                    <table className="w-full table-fixed border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[#d4af37]/30 bg-gradient-to-r from-[#1a1509] via-[#13110b] to-[#1a1509] font-mono text-xs tracking-wider text-[#f5dc82] uppercase">
                          <th className="w-[9%] py-4 pl-5 pr-2">Pos</th>
                          <th className="w-[24%] py-4 px-2">Player Name</th>
                          <th className="w-[6.5%] py-4 text-center">1st</th>
                          <th className="w-[6.5%] py-4 text-center">2nd</th>
                          <th className="w-[6.5%] py-4 text-center">3rd</th>
                          <th className="w-[6.5%] py-4 text-center">4th</th>
                          <th className="w-[6.5%] py-4 text-center">5th</th>
                          <th className="w-[6.5%] py-4 text-center">6th</th>
                          <th className="w-[10%] py-4 text-center">
                            Quizzes
                          </th>
                          <th className="w-[9%] py-4 text-center">
                            Qualified
                          </th>
                          <th className="w-[9%] py-4 pr-5 text-right">
                            Points
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4af37]/12 text-sm tabular-nums">
                        {standings.map((row, idx) => (
                          <motion.tr
                            key={row.player}
                            initial={{ opacity: 0, x: -14 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            whileHover={{ x: 4 }}
                            transition={{
                              duration: 0.32,
                              delay: Math.min(idx * 0.04, 0.25),
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className={`group transition-colors duration-200 hover:bg-[#d4af37]/12 hover:shadow-[inset_2px_0_0_#d4af37] ${
                              idx === 0
                                ? 'bg-[#d4af37]/8'
                                : idx === 1
                                  ? 'bg-white/[0.03]'
                                  : idx === 2
                                    ? 'bg-[#b86b35]/[0.06]'
                                    : ''
                            }`}
                          >
                            <td className="py-4 pl-5 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#d4af37]">
                                  #{idx + 1}
                                </span>
                                {idx === 0 && (
                                  <FirstGoldCrown className="h-5 w-5" />
                                )}
                                {idx === 1 && (
                                  <SecondSilverCrown className="h-5 w-5" />
                                )}
                                {idx === 2 && (
                                  <ThirdBronzeCrown className="h-5 w-5" />
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-2">
                              <span className="block truncate font-semibold text-[#f8f5ee] group-hover:text-[#f8e6a0]">
                                {row.player}
                              </span>
                            </td>
                            <td className="py-4 text-center font-mono font-semibold text-[#f8e6a0]">
                              {row.first}
                            </td>
                            <td className="py-4 text-center font-mono text-slate-200">
                              {row.second}
                            </td>
                            <td className="py-4 text-center font-mono text-[#f5c08D]">
                              {row.third}
                            </td>
                            <td className="py-4 text-center font-mono text-neutral-300">
                              {row.fourth}
                            </td>
                            <td className="py-4 text-center font-mono text-neutral-300">
                              {row.fifth}
                            </td>
                            <td className="py-4 text-center font-mono text-neutral-300">
                              {row.sixth}
                            </td>
                            <td className="py-4 text-center font-mono font-medium text-white">
                              {row.totalQuizzes}
                            </td>
                            <td className="py-4 text-center font-mono text-emerald-300">
                              {row.qualified}
                            </td>
                            <td className="py-4 pr-5 text-right font-mono text-base font-bold text-[#f0cb65]">
                              <span>{row.points}</span>
                              {(awardBonusMap.get(row.player) || 0) > 0 && (
                                <span
                                  title={`Includes +${awardBonusMap.get(row.player)} Season Honors bonus`}
                                  className="ml-1 text-[10px] font-semibold text-emerald-300"
                                >
                                  (+{awardBonusMap.get(row.player)})
                                </span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Trophy Cards (Zero sideways scroll!) */}
                  <div className="mt-4 space-y-3.5 md:hidden">
                    {standings.map((row, idx) => (
                      <motion.div
                        key={row.player}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.15 }}
                        whileHover={{ y: -3 }}
                        transition={{
                          duration: 0.32,
                          delay: Math.min(idx * 0.04, 0.25),
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="rounded-2xl border border-[#d4af37]/30 bg-[#100e0a] p-4 transition-colors hover:border-[#d4af37]/60 hover:shadow-[0_12px_28px_rgba(212,175,55,0.12)]"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-[#d4af37]/15 pb-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#d4af37]">
                              #{idx + 1}
                            </span>
                            {idx === 0 && (
                              <FirstGoldCrown className="h-5 w-5 shrink-0" />
                            )}
                            {idx === 1 && (
                              <SecondSilverCrown className="h-5 w-5 shrink-0" />
                            )}
                            {idx === 2 && (
                              <ThirdBronzeCrown className="h-5 w-5 shrink-0" />
                            )}
                            <span className="truncate font-display text-base font-bold text-[#f8e6a0]">
                              {row.player}
                            </span>
                          </div>
                          <span className="shrink-0 font-mono text-sm font-bold text-[#f0cb65]">
                            {row.points} pts
                            {(awardBonusMap.get(row.player) || 0) > 0 && (
                              <span className="ml-1 text-[10px] font-semibold text-emerald-300">
                                (+{awardBonusMap.get(row.player)})
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-6 gap-1.5 text-center font-mono text-xs tabular-nums">
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-[#f5dc82]">
                              1st
                            </span>
                            <span className="font-bold text-white">
                              {row.first}
                            </span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-slate-300">
                              2nd
                            </span>
                            <span className="font-bold text-white">
                              {row.second}
                            </span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-[#f5c08D]">
                              3rd
                            </span>
                            <span className="font-bold text-white">
                              {row.third}
                            </span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-neutral-400">
                              4th
                            </span>
                            <span className="font-bold text-white">
                              {row.fourth}
                            </span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-neutral-400">
                              5th
                            </span>
                            <span className="font-bold text-white">
                              {row.fifth}
                            </span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-neutral-400">
                              6th
                            </span>
                            <span className="font-bold text-white">
                              {row.sixth}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-neutral-400">
                          <span>Total Quizzes: {row.totalQuizzes}</span>
                          <span className="text-emerald-300">
                            Qualified: {row.qualified}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ================= 3. EXTERNAL WINS SUB-TAB (YEARWISE + FILTERS) ================= */}
          {subTab === 'external-wins' && (
            <motion.div
              key="external-wins"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex flex-col justify-between gap-5 rounded-2xl border border-[#d4af37]/30 bg-[#07162b] p-5 shadow-lg lg:flex-row lg:items-center">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    External Wins & Yearwise Archive
                  </h2>
                  <p className="mt-1 text-xs text-[#f5f5f0]/75">
                    Select a Bikram Sambat year below or combine filters in the
                    top corner. Click any quiz box to reveal full details.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
                  <select
                    aria-label="Filter by B.S. Year"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="rounded-lg border border-[#d4af37]/35 bg-[#0a1f3a] px-3 py-2 font-mono text-xs text-white focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="">All Years (B.S.)</option>
                    {bsYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} B.S.
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by Position"
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    className="rounded-lg border border-[#d4af37]/35 bg-[#0a1f3a] px-3 py-2 text-xs text-white focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="">All Positions</option>
                    {POSITION_OPTIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by Host"
                    value={filterHost}
                    onChange={(e) => setFilterHost(e.target.value)}
                    className="rounded-lg border border-[#d4af37]/35 bg-[#0a1f3a] px-3 py-2 text-xs text-white focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="">All Hosts</option>
                    {uniqueHosts.map((host) => (
                      <option key={host} value={host}>
                        {host}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by Player"
                    value={filterPlayer}
                    onChange={(e) => setFilterPlayer(e.target.value)}
                    className="rounded-lg border border-[#d4af37]/35 bg-[#0a1f3a] px-3 py-2 text-xs text-white focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="">All Players</option>
                    {uniquePlayers.map((player) => (
                      <option key={player} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>

                  {hasAnyFilter && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d4af37]/50 bg-[#d4af37]/15 px-3 py-2 text-xs font-semibold text-[#f8e6a0] transition-colors hover:bg-[#d4af37]/25 cursor-pointer sm:col-span-1"
                    >
                      <FilterX className="h-3.5 w-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {!hasAnyFilter ? (
                <div className="mt-8">
                  <p className="mb-4 font-mono text-xs tracking-wider text-[#d4af37] uppercase">
                    Choose a Bikram Sambat Year
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {bsYears.map((yr, idx) => {
                      const yearQuizzes = quizzes.filter(
                        (q) => q.yearBS === yr
                      );
                      const firstCount = yearQuizzes.filter(
                        (q) => q.position === '1st'
                      ).length;

                      return (
                        <motion.button
                          key={yr}
                          type="button"
                          initial={{ opacity: 0, y: 20, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: idx * 0.07 }}
                          whileHover={{ y: -6, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFilterYear(yr)}
                          className="sheen-hover group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#d4af37]/40 bg-gradient-to-br from-[#0e2a4d] via-[#0a1f3a] to-[#071528] p-6 text-left shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-colors hover:border-[#f5dc82] cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-mono text-3xl font-bold tracking-tight text-[#f8e6a0] group-hover:text-white">
                              {yr}
                            </span>
                            <div className="rounded-xl border border-[#7c4d2b]/60 bg-[#7c4d2b]/25 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#f5c08D]">
                              B.S.
                            </div>
                          </div>

                          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-[#f5f5f0]/80">
                            <span>
                              {yearQuizzes.length}{' '}
                              {yearQuizzes.length === 1 ? 'Quiz' : 'Quizzes'}
                            </span>
                            {firstCount > 0 && (
                              <span className="font-semibold text-[#f0cb65]">
                                {firstCount} Gold {firstCount === 1 ? 'Win' : 'Wins'}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-8">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#d4af37]/40 bg-[#07162b] px-3.5 py-2 text-xs font-semibold text-[#f8e6a0] transition-colors hover:border-[#f0cb65] hover:bg-[#0f294a] cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to All Years</span>
                    </button>

                    <p className="font-mono text-xs text-[#f5f5f0]/80">
                      Showing {filteredQuizzes.length}{' '}
                      {filteredQuizzes.length === 1 ? 'record' : 'records'}
                      {filterYear ? ` · ${filterYear} B.S.` : ''}
                    </p>
                  </div>

                  {filteredQuizzes.length === 0 ? (
                    <div className="rounded-2xl border border-white/15 bg-[#07162b] p-12 text-center">
                      <Trophy className="mx-auto h-10 w-10 text-[#d4af37]/50" />
                      <h3 className="mt-3 font-display text-xl font-bold text-white">
                        No Matching Quiz Records
                      </h3>
                      <p className="mt-1 text-sm text-[#f5f5f0]/70">
                        Try clearing one of your active filters.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredQuizzes.map((quiz, idx) => {
                        const theme = getQuizCardTheme(quiz.position);
                        return (
                          <motion.button
                            key={quiz.id}
                            type="button"
                            initial={{ opacity: 0, y: 22, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              duration: 0.42,
                              delay: idx * 0.06,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            whileHover={{ y: -7, scale: 1.02 }}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => setSelectedQuiz(quiz)}
                            className={`sheen-hover group relative flex min-h-[215px] flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 text-center transition-all duration-300 cursor-pointer ${theme.wrapper}`}
                          >
                            <div
                              aria-hidden="true"
                              className={`pointer-events-none absolute inset-0 ${theme.aura}`}
                            />

                            <div className="relative z-10 flex flex-col items-center">
                              <PositionCrownOrEmblem
                                position={quiz.position}
                                className="h-14 w-14"
                              />
                              <span
                                className={`mt-3 font-mono text-xs font-bold tracking-wider uppercase ${theme.labelColor}`}
                              >
                                {quiz.position === 'Not Qualified'
                                  ? 'Not Qualified'
                                  : `${quiz.position} Place`}
                              </span>
                              <h3 className="mt-2 font-display text-lg font-bold leading-snug text-white group-hover:text-[#f8e6a0]">
                                {quiz.quizName}
                              </h3>
                              <span className="mt-4 text-[11px] font-medium text-white/55 transition-colors group-hover:text-white/90">
                                Click to inspect details
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= 4. SQUAD SYNERGY SUB-TAB ================= */}
          {subTab === 'synergy' && (
            <motion.div
              key="synergy"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-[#d4af37]/40 bg-[#08080a] p-6 text-[#f5f2eb] shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-10"
            >
              {/* Header & Filters */}
              <div className="flex flex-col justify-between gap-5 border-b border-[#d4af37]/20 pb-7 lg:flex-row lg:items-end">
                <div>
                  <p className="font-mono text-xs tracking-[0.2em] text-[#d4af37] uppercase">
                    Teammate Chemistry & Podium Analytics
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl font-bold text-[#f8e6a0] sm:text-3xl">
                    Squad Synergy
                  </h2>
                  <p className="mt-1.5 text-xs text-neutral-400">
                    Tracks 1st, 2nd, and 3rd podium finishes together across
                    External Wins. Filter by B.S. year or search any player.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Player Input */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#d4af37]/70" />
                    <input
                      type="text"
                      value={synergySearch}
                      onChange={(e) => setSynergySearch(e.target.value)}
                      placeholder="Search player name..."
                      className="w-48 rounded-xl border border-[#d4af37]/40 bg-[#12110d] py-2.5 pl-8 pr-8 text-xs text-white placeholder-neutral-500 focus:border-[#f0cb65] focus:outline-none sm:w-52"
                    />
                    {synergySearch && (
                      <button
                        type="button"
                        onClick={() => setSynergySearch('')}
                        aria-label="Clear player search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Year-wise B.S. Filter */}
                  <select
                    aria-label="Filter synergy by B.S. year"
                    value={synergyYear}
                    onChange={(e) => setSynergyYear(e.target.value)}
                    className="rounded-xl border border-[#d4af37]/40 bg-[#12110d] px-3.5 py-2.5 font-mono text-xs font-semibold text-[#f8e6a0] focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All B.S. Years</option>
                    {bsYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} B.S.
                      </option>
                    ))}
                  </select>

                  {/* Sort Category */}
                  <select
                    aria-label="Sort squad synergy"
                    value={synergySort}
                    onChange={(e) =>
                      setSynergySort(
                        e.target.value as
                          | 'podiums'
                          | 'first'
                          | 'second'
                          | 'third'
                          | 'points'
                          | 'qual-rate'
                      )
                    }
                    className="rounded-xl border border-[#d4af37]/40 bg-[#12110d] px-3.5 py-2.5 text-xs font-semibold text-[#f8e6a0] focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="podiums">Sort: Total Podiums (1st–3rd)</option>
                    <option value="first">Sort: Most 1st Places</option>
                    <option value="second">Sort: Most 2nd Places</option>
                    <option value="third">Sort: Most 3rd Places</option>
                    <option value="points">Sort: Highest Points</option>
                    <option value="qual-rate">Sort: Highest Qual %</option>
                  </select>
                </div>
              </div>

              {/* Quick Player Filter Chips */}
              {uniquePlayers.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-neutral-400 uppercase">
                    Quick Filter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSynergySearch('')}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      !synergySearch
                        ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#f8e6a0]'
                        : 'border-white/15 bg-white/5 text-neutral-300 hover:text-white'
                    }`}
                  >
                    All Players
                  </button>
                  {uniquePlayers.map((pl) => {
                    const active =
                      synergySearch.trim().toLowerCase() === pl.toLowerCase();
                    return (
                      <button
                        key={pl}
                        type="button"
                        onClick={() =>
                          setSynergySearch(active ? '' : pl)
                        }
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#f8e6a0]'
                            : 'border-white/15 bg-white/5 text-neutral-300 hover:border-[#d4af37]/40 hover:text-white'
                        }`}
                      >
                        {pl}
                      </button>
                    );
                  })}
                </div>
              )}

              {synergyRows.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-[#d4af37]/20 bg-[#11100d] p-12 text-center">
                  <Users className="mx-auto h-9 w-9 text-[#d4af37]/60" />
                  <p className="mt-3 text-sm text-neutral-300">
                    No teammate pairs found for this year or player filter.
                  </p>
                </div>
              ) : (
                <>
                  {/* Top 3 Synergy Spotlight Cards */}
                  <div className="mt-7 grid gap-4 md:grid-cols-3">
                    {synergyRows.slice(0, 3).map((pair, idx) => (
                      <motion.div
                        key={pair.key}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.15 }}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.35, delay: idx * 0.06 }}
                        className={`rounded-2xl border p-5 ${
                          idx === 0
                            ? 'border-[#d4af37]/60 bg-gradient-to-br from-[#1d1709] to-[#0e0c08] shadow-[0_14px_40px_rgba(212,175,55,0.14)]'
                            : idx === 1
                              ? 'border-slate-300/40 bg-gradient-to-br from-[#151a24] to-[#0c0d11]'
                              : 'border-[#b86b35]/45 bg-gradient-to-br from-[#1c110b] to-[#0d0a08]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[#d4af37]">
                            #{idx + 1} DUO SYNERGY
                          </span>
                          <span className="font-mono text-xs font-bold text-[#f8e6a0]">
                            {pair.qualRate}% Qual.
                          </span>
                        </div>
                        <h3 className="mt-2 font-display text-lg font-bold text-white">
                          {pair.playerA} &amp; {pair.playerB}
                        </h3>

                        <div className="mt-4 grid grid-cols-4 gap-2 text-center font-mono text-xs">
                          <div className="rounded-lg border border-[#d4af37]/25 bg-black/30 py-2">
                            <span className="block text-[10px] text-[#f5dc82]">
                              1st
                            </span>
                            <span className="font-bold text-white">
                              {pair.first}
                            </span>
                          </div>
                          <div className="rounded-lg border border-slate-300/20 bg-black/30 py-2">
                            <span className="block text-[10px] text-slate-300">
                              2nd
                            </span>
                            <span className="font-bold text-white">
                              {pair.second}
                            </span>
                          </div>
                          <div className="rounded-lg border border-[#b86b35]/25 bg-black/30 py-2">
                            <span className="block text-[10px] text-[#f5c08D]">
                              3rd
                            </span>
                            <span className="font-bold text-white">
                              {pair.third}
                            </span>
                          </div>
                          <div className="rounded-lg border border-emerald-400/25 bg-black/30 py-2">
                            <span className="block text-[10px] text-emerald-300">
                              Podiums
                            </span>
                            <span className="font-bold text-emerald-200">
                              {pair.podiums}
                            </span>
                          </div>
                        </div>

                        <p className="mt-3 font-mono text-[11px] text-neutral-400">
                          {pair.qualified}/{pair.totalQuizzes} Qualified ·{' '}
                          <span className="text-[#f0cb65]">
                            {pair.points} pts
                          </span>
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Full Pair Breakdown Table (Desktop) */}
                  <div className="mt-7 hidden overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-[#0d0c09] md:block">
                    <table className="w-full table-fixed border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[#d4af37]/25 bg-[#15120b] font-mono text-xs tracking-wider text-[#f5dc82] uppercase">
                          <th className="w-[8%] py-3.5 pl-5">Rank</th>
                          <th className="w-[30%] py-3.5 px-2">Teammate Pair</th>
                          <th className="w-[8%] py-3.5 text-center">1st</th>
                          <th className="w-[8%] py-3.5 text-center">2nd</th>
                          <th className="w-[8%] py-3.5 text-center">3rd</th>
                          <th className="w-[10%] py-3.5 text-center">Podiums</th>
                          <th className="w-[10%] py-3.5 text-center">Quizzes</th>
                          <th className="w-[9%] py-3.5 text-center">Qual %</th>
                          <th className="w-[9%] py-3.5 pr-5 text-right">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4af37]/12 text-sm tabular-nums">
                        {synergyRows.map((pair, idx) => (
                          <motion.tr
                            key={pair.key}
                            initial={{ opacity: 0, x: -12 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            whileHover={{ x: 4 }}
                            transition={{
                              duration: 0.28,
                              delay: Math.min(idx * 0.03, 0.2),
                            }}
                            className="transition-colors hover:bg-[#d4af37]/10 hover:shadow-[inset_2px_0_0_#d4af37]"
                          >
                            <td className="py-3.5 pl-5 font-mono text-xs font-bold text-[#d4af37]">
                              #{idx + 1}
                            </td>
                            <td className="py-3.5 px-2 font-semibold text-white">
                              {pair.playerA}{' '}
                              <span className="text-[#d4af37]">+</span>{' '}
                              {pair.playerB}
                            </td>
                            <td className="py-3.5 text-center font-mono font-semibold text-[#f8e6a0]">
                              {pair.first}
                            </td>
                            <td className="py-3.5 text-center font-mono text-slate-200">
                              {pair.second}
                            </td>
                            <td className="py-3.5 text-center font-mono text-[#f5c08D]">
                              {pair.third}
                            </td>
                            <td className="py-3.5 text-center font-mono font-bold text-emerald-300">
                              {pair.podiums}
                            </td>
                            <td className="py-3.5 text-center font-mono text-neutral-300">
                              {pair.totalQuizzes}
                            </td>
                            <td className="py-3.5 text-center font-mono text-emerald-200">
                              {pair.qualRate}%
                            </td>
                            <td className="py-3.5 pr-5 text-right font-mono font-bold text-[#f0cb65]">
                              {pair.points}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Synergy Cards */}
                  <div className="mt-6 space-y-3 md:hidden">
                    {synergyRows.map((pair, idx) => (
                      <div
                        key={pair.key}
                        className="rounded-2xl border border-[#d4af37]/30 bg-[#100e0a] p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-display text-base font-bold text-white">
                            <span className="mr-2 font-mono text-xs text-[#d4af37]">
                              #{idx + 1}
                            </span>
                            {pair.playerA} &amp; {pair.playerB}
                          </p>
                          <span className="font-mono text-xs font-bold text-[#f0cb65]">
                            {pair.points} pts
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-center font-mono text-xs">
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-[#f5dc82]">
                              1st
                            </span>
                            <span className="font-bold">{pair.first}</span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-slate-300">
                              2nd
                            </span>
                            <span className="font-bold">{pair.second}</span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-[#f5c08D]">
                              3rd
                            </span>
                            <span className="font-bold">{pair.third}</span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-emerald-300">
                              Qual %
                            </span>
                            <span className="font-bold text-emerald-200">
                              {pair.qualRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QUIZ DETAIL POP-UP MODAL */}
      <AnimatePresence>
        {selectedQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedQuiz(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#d4af37]/50 bg-[#08192f] p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.75)] sm:p-8"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-4">
                  <PositionCrownOrEmblem
                    position={selectedQuiz.position}
                    className="h-14 w-14 shrink-0"
                  />
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#f5dc82]">
                      {selectedQuiz.yearBS} B.S. ·{' '}
                      {selectedQuiz.position === 'Not Qualified'
                        ? 'Not Qualified'
                        : `${selectedQuiz.position} Place`}{' '}
                      ({POSITION_POINTS[selectedQuiz.position]} pts)
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-bold text-white">
                      {selectedQuiz.quizName}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuiz(null)}
                  aria-label="Close quiz details"
                  className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#0b2340] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#d4af37]">
                    <MapPin className="h-4 w-4" />
                    <span>Host / Organizer</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-white">
                    {selectedQuiz.host}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b2340] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#d4af37]">
                    <Calendar className="h-4 w-4" />
                    <span>Year & Teams</span>
                  </div>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                    {selectedQuiz.yearBS} B.S. · {selectedQuiz.teamCount} Teams
                    Competed
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b2340] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#d4af37]">
                    <Users className="h-4 w-4" />
                    <span>Participating Players</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-[#f5f5f0]">
                    {selectedQuiz.players.join(', ')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b2340] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#d4af37]">
                    <Star className="h-4 w-4" />
                    <span>Overall Performance Rating</span>
                  </div>
                  <p className="mt-1.5 font-mono text-sm font-bold text-[#f8e6a0]">
                    {selectedQuiz.rating} / 10
                  </p>
                </div>
              </div>

              {selectedQuiz.extraNote && (
                <div className="mt-5 rounded-xl border border-[#7c4d2b]/50 bg-[#f5f5f0] p-4 text-[#0a1f3a]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7c4d2b] uppercase">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Archivist Note</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed">
                    {selectedQuiz.extraNote}
                  </p>
                </div>
              )}

              {selectedQuiz.photos.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 font-mono text-xs font-semibold text-[#d4af37] uppercase">
                    Attached Photographs
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedQuiz.photos.map((url, pIdx) => (
                      <button
                        key={`${url}-${pIdx}`}
                        type="button"
                        onClick={() =>
                          setLightbox({
                            photos: selectedQuiz.photos.map((u) => ({
                              url: u,
                              title: selectedQuiz.quizName,
                              subtitle: `${selectedQuiz.yearBS} B.S. · ${selectedQuiz.host}`,
                            })),
                            index: pIdx,
                          })
                        }
                        className="group relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-[#7c4d2b] cursor-pointer"
                      >
                        <img
                          src={url}
                          alt={`${selectedQuiz.quizName} photo ${pIdx + 1}`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                          <ZoomIn className="h-6 w-6 text-[#f8e6a0]" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN LIGHTBOX */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close lightbox"
              className="absolute right-5 top-5 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>

            {lightbox.photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index:
                              (prev.index - 1 + prev.photos.length) %
                              prev.photos.length,
                          }
                        : null
                    );
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index + 1) % prev.photos.length,
                          }
                        : null
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 cursor-pointer"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <motion.div
              key={lightbox.index}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-4xl overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-[#090d14] shadow-2xl"
            >
              <img
                src={lightbox.photos[lightbox.index].url}
                alt={lightbox.photos[lightbox.index].title}
                referrerPolicy="no-referrer"
                className="max-h-[72vh] w-full object-contain bg-black"
              />
              <div className="border-t border-white/10 p-4 text-center">
                <p className="font-display text-lg font-bold text-[#f8e6a0]">
                  {lightbox.photos[lightbox.index].title}
                </p>
                <p className="mt-1 text-xs text-neutral-300">
                  {lightbox.photos[lightbox.index].subtitle}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
