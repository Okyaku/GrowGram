import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generateRoadmapFromAI } from "../services/aws";

type MilestoneBase = {
  id: string;
  roadmapId: string;
  roadmapGoal: string;
  title: string;
  subtitle: string;
};

type Milestone = MilestoneBase & {
  status: "locked" | "current" | "completed";
};

type RoadmapLevel = "easy" | "normal" | "hard";
type BuildMode = "ai-auto" | "manual-level";

type LearningStyle = "practice" | "theory" | "balanced";

type RoadmapTaskTemplate = {
  id: string;
  title: string;
  description: string;
};

type RoadmapMilestoneTemplate = {
  id: string;
  title: string;
  description: string;
  tasks: RoadmapTaskTemplate[];
};

type RoadmapGenerationParams = {
  goal: string;
  deadline: string;
  currentLevel: string;
  weeklyHours: string;
  deliverable: string;
  learningStyle: LearningStyle;
  setbacks: string;
  level?: RoadmapLevel;
};

type RoadmapItem = {
  id: string;
  goal: string;
  mode: BuildMode;
  level: RoadmapLevel;
  roadmapMilestones: RoadmapMilestoneTemplate[];
  milestoneTemplates: {
    id: string;
    title: string;
    subtitle: string;
    sourceMilestoneId?: string;
    sourceTaskId?: string;
  }[];
  completedCount: number;
  unlockedMilestoneIds: string[];
  postedMilestoneIds: string[];
};

type AppNotification = {
  id: string;
  message: string;
  time: string;
};

type ActivityLevel = 0 | 1 | 2 | 3;
type ActivitySource =
  | "action"
  | "story"
  | "milestone-post"
  | "post"
  | "milestone";

type RoadmapContextType = {
  roadmaps: RoadmapItem[];
  activeRoadmapId: string;
  activeRoadmap: RoadmapItem;
  milestones: Milestone[];
  completedCount: number;
  activePostCredits: number;
  unlockedMilestoneIds: string[];
  unlockedMilestones: MilestoneBase[];
  activeUnlockedMilestones: MilestoneBase[];
  postedMilestoneIds: string[];
  notifications: AppNotification[];
  activityByDate: Record<string, ActivityLevel>;
  streakDays: number;
  totalScore: number;
  level: number;
  postCredits: number;
  canCreatePost: boolean;
  isGeneratingRoadmap: boolean;
  lastGenerateError: string;
  setActiveRoadmap: (roadmapId: string) => void;
  moveRoadmap: (roadmapId: string, direction: "up" | "down") => void;
  addRoadmap: (params: {
    goal: string;
    mode: BuildMode;
    level?: RoadmapLevel;
  }) => void;
  generateRoadmap: (
    params: RoadmapGenerationParams,
  ) => Promise<{ success: boolean; roadmapId?: string }>;
  updateMilestone: (params: {
    roadmapId: string;
    milestoneId: string;
    title: string;
    subtitle: string;
  }) => void;
  recordDailyActivity: (source: ActivitySource) => void;
  adjustScore: (delta: number) => void;
  logout: (options?: { clearProgress?: boolean }) => void;
  clearCurrentMilestone: () => void;
  consumePostCredit: (milestoneId: string) => boolean;
};

type PersistedRoadmapState = {
  roadmaps: RoadmapItem[];
  activeRoadmapId: string;
  streakDays: number;
  lastActivityDate: string;
  totalScore: number;
  activityByDate: Record<string, ActivityLevel>;
  notifications: AppNotification[];
};

const levelToCount: Record<RoadmapLevel, number> = {
  easy: 3,
  normal: 5,
  hard: 7,
};

const nowText = () => "今";

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const dayDiff = (from: string, to: string) => {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.floor(diffMs / 86400000);
};

const sourceToLevel = (source: ActivitySource): ActivityLevel => {
  if (source === "milestone-post" || source === "post") {
    return 3;
  }
  if (source === "story") {
    return 2;
  }
  return 1;
};

const buildManualRoadmapMilestones = (
  roadmapId: string,
  goal: string,
  count: number,
): RoadmapMilestoneTemplate[] => {
  const normalizedGoal = goal.trim() || "目標";

  return Array.from({ length: count }).map((_, index) => {
    const step = index + 1;
    const phase = index === 0 ? "理解" : index < count - 1 ? "実践" : "達成";
    const milestoneId = `${roadmapId}-phase-${step}`;
    const taskId = `${roadmapId}-task-${step}-1`;

    return {
      id: milestoneId,
      title: `${normalizedGoal} - Step ${step}`,
      description: `${phase}フェーズ`,
      tasks: [
        {
          id: taskId,
          title: `${normalizedGoal} - Step ${step}`,
          description: `${phase}フェーズを進める`,
        },
      ],
    };
  });
};

const flattenTasksToMilestones = (
  roadmapId: string,
  goal: string,
  roadmapMilestones: RoadmapMilestoneTemplate[],
) => {
  const flattened = roadmapMilestones.flatMap((milestone, milestoneIndex) =>
    milestone.tasks.map((task, taskIndex) => ({
      id: `${roadmapId}-m${milestoneIndex + 1}-${taskIndex + 1}`,
      title: task.title,
      subtitle: `${milestone.title} | ${task.description}`,
      sourceMilestoneId: milestone.id,
      sourceTaskId: task.id,
    })),
  );

  if (flattened.length > 0) {
    return flattened;
  }

  return [
    {
      id: `${roadmapId}-m1`,
      title: `${goal.trim() || "目標"} - Step 1`,
      subtitle: "実践フェーズ",
      sourceMilestoneId: `${roadmapId}-phase-1`,
      sourceTaskId: `${roadmapId}-task-1-1`,
    },
  ];
};

const createRoadmapItem = (params: {
  id: string;
  goal: string;
  mode: BuildMode;
  level: RoadmapLevel;
  roadmapMilestones?: RoadmapMilestoneTemplate[];
}) => {
  const fallbackCount = levelToCount[params.level];
  const roadmapMilestones =
    params.roadmapMilestones && params.roadmapMilestones.length > 0
      ? params.roadmapMilestones
      : buildManualRoadmapMilestones(params.id, params.goal, fallbackCount);
  const milestoneTemplates = flattenTasksToMilestones(
    params.id,
    params.goal,
    roadmapMilestones,
  );

  return {
    id: params.id,
    goal: params.goal,
    mode: params.mode,
    level: params.level,
    roadmapMilestones,
    milestoneTemplates,
    completedCount: 0,
    unlockedMilestoneIds: [] as string[],
    postedMilestoneIds: [] as string[],
  } satisfies RoadmapItem;
};

const normalizeRoadmapItem = (item: RoadmapItem): RoadmapItem => {
  const safeGoal = item.goal?.trim() || "目標";
  const safeLevel: RoadmapLevel = levelToCount[item.level]
    ? item.level
    : "normal";
  const fallbackMilestones = buildManualRoadmapMilestones(
    item.id,
    safeGoal,
    levelToCount[safeLevel],
  );
  const normalizedRoadmapMilestones =
    Array.isArray(item.roadmapMilestones) && item.roadmapMilestones.length > 0
      ? item.roadmapMilestones
      : fallbackMilestones;
  const normalizedMilestones =
    Array.isArray(item.milestoneTemplates) && item.milestoneTemplates.length > 0
      ? item.milestoneTemplates
      : flattenTasksToMilestones(
          item.id,
          safeGoal,
          normalizedRoadmapMilestones,
        );
  const maxCompletedCount = normalizedMilestones.length;

  return {
    ...item,
    goal: safeGoal,
    level: safeLevel,
    roadmapMilestones: normalizedRoadmapMilestones,
    milestoneTemplates: normalizedMilestones,
    completedCount: Math.max(
      0,
      Math.min(item.completedCount ?? 0, maxCompletedCount),
    ),
    unlockedMilestoneIds: Array.isArray(item.unlockedMilestoneIds)
      ? item.unlockedMilestoneIds
      : [],
    postedMilestoneIds: Array.isArray(item.postedMilestoneIds)
      ? item.postedMilestoneIds
      : [],
  };
};

const initialRoadmap = createRoadmapItem({
  id: "roadmap-1",
  goal: "Full-stack Developerになる",
  mode: "manual-level",
  level: "normal",
});

initialRoadmap.completedCount = 1;
initialRoadmap.unlockedMilestoneIds = [initialRoadmap.milestoneTemplates[0].id];

const ROADMAP_STORAGE_KEY = "@growgram/roadmap-state/v1";

const RoadmapContext = createContext<RoadmapContextType | null>(null);

export const RoadmapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([initialRoadmap]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string>(
    initialRoadmap.id,
  );
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [lastGenerateError, setLastGenerateError] = useState("");
  const [streakDays, setStreakDays] = useState<number>(1);
  const [lastActivityDate, setLastActivityDate] = useState<string>(
    toDateKey(new Date()),
  );
  const [totalScore, setTotalScore] = useState<number>(12450);
  const [activityByDate, setActivityByDate] = useState<
    Record<string, ActivityLevel>
  >(() => {
    const today = toDateKey(new Date());
    return { [today]: 1 };
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "n-init",
      message: `最初のマイルストーン「${initialRoadmap.milestoneTemplates[0].title}」が投稿可能です。`,
      time: "今",
    },
  ]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPersistedState = async () => {
      try {
        const raw = await AsyncStorage.getItem(ROADMAP_STORAGE_KEY);
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw) as Partial<PersistedRoadmapState>;
        if (!mounted || !parsed) {
          return;
        }

        if (Array.isArray(parsed.roadmaps) && parsed.roadmaps.length > 0) {
          setRoadmaps(
            parsed.roadmaps.map((item) => normalizeRoadmapItem(item)),
          );

          const fallbackActive = parsed.roadmaps[0]?.id ?? initialRoadmap.id;
          setActiveRoadmapId(parsed.activeRoadmapId || fallbackActive);
        }

        if (typeof parsed.streakDays === "number") {
          setStreakDays(parsed.streakDays);
        }

        if (
          typeof parsed.lastActivityDate === "string" &&
          parsed.lastActivityDate.length > 0
        ) {
          setLastActivityDate(parsed.lastActivityDate);
        }

        if (typeof parsed.totalScore === "number") {
          setTotalScore(parsed.totalScore);
        }

        if (
          parsed.activityByDate &&
          typeof parsed.activityByDate === "object"
        ) {
          setActivityByDate(
            parsed.activityByDate as Record<string, ActivityLevel>,
          );
        }

        if (Array.isArray(parsed.notifications)) {
          setNotifications(parsed.notifications);
        }
      } catch (error) {
        console.warn("[Roadmap] failed to restore persisted state:", error);
      } finally {
        if (mounted) {
          setIsHydrated(true);
        }
      }
    };

    void loadPersistedState();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistState = async () => {
      const payload: PersistedRoadmapState = {
        roadmaps,
        activeRoadmapId,
        streakDays,
        lastActivityDate,
        totalScore,
        activityByDate,
        notifications,
      };

      try {
        await AsyncStorage.setItem(
          ROADMAP_STORAGE_KEY,
          JSON.stringify(payload),
        );
      } catch (error) {
        console.warn("[Roadmap] failed to persist state:", error);
      }
    };

    void persistState();
  }, [
    activityByDate,
    activeRoadmapId,
    isHydrated,
    lastActivityDate,
    notifications,
    roadmaps,
    streakDays,
    totalScore,
  ]);

  const activeRoadmap = useMemo(() => {
    return (
      roadmaps.find((roadmap) => roadmap.id === activeRoadmapId) ??
      roadmaps[0] ??
      initialRoadmap
    );
  }, [activeRoadmapId, roadmaps]);

  const milestones = useMemo<Milestone[]>(() => {
    return activeRoadmap.milestoneTemplates.map((milestone, index) => {
      if (index < activeRoadmap.completedCount) {
        return {
          ...milestone,
          roadmapId: activeRoadmap.id,
          roadmapGoal: activeRoadmap.goal,
          status: "completed",
        };
      }

      if (index === activeRoadmap.completedCount) {
        return {
          ...milestone,
          roadmapId: activeRoadmap.id,
          roadmapGoal: activeRoadmap.goal,
          status: "current",
        };
      }

      return {
        ...milestone,
        roadmapId: activeRoadmap.id,
        roadmapGoal: activeRoadmap.goal,
        status: "locked",
      };
    });
  }, [activeRoadmap]);

  const unlockedMilestones = useMemo(() => {
    return roadmaps.flatMap((roadmap) =>
      roadmap.milestoneTemplates
        .filter((milestone) =>
          roadmap.unlockedMilestoneIds.includes(milestone.id),
        )
        .map((milestone) => ({
          ...milestone,
          roadmapId: roadmap.id,
          roadmapGoal: roadmap.goal,
        })),
    );
  }, [roadmaps]);

  const activeUnlockedMilestones = useMemo(() => {
    return unlockedMilestones.filter(
      (milestone) => milestone.roadmapId === activeRoadmap.id,
    );
  }, [activeRoadmap.id, unlockedMilestones]);

  const unlockedMilestoneIds = activeRoadmap.unlockedMilestoneIds;
  const postedMilestoneIds = activeRoadmap.postedMilestoneIds;
  const completedCount = activeRoadmap.completedCount;
  const activePostCredits = activeRoadmap.unlockedMilestoneIds.length;

  const postCredits = unlockedMilestones.length;
  const canCreatePost = postCredits > 0;
  const level = Math.max(1, Math.floor(totalScore / 1000));

  const recordDailyActivity: RoadmapContextType["recordDailyActivity"] = (
    source,
  ) => {
    const today = toDateKey(new Date());
    const levelFromSource = sourceToLevel(source);

    setStreakDays((prev) => {
      if (today === lastActivityDate) {
        return prev;
      }

      if (!lastActivityDate) {
        return 1;
      }

      const diff = dayDiff(lastActivityDate, today);
      if (diff === 1) {
        return prev + 1;
      }

      return 1;
    });

    setLastActivityDate(today);

    setActivityByDate((prev) => {
      const current = prev[today] ?? 0;
      const nextLevel = Math.max(current, levelFromSource) as ActivityLevel;
      if (nextLevel === current) {
        return prev;
      }
      return {
        ...prev,
        [today]: nextLevel,
      };
    });

    const gained = levelFromSource === 3 ? 90 : levelFromSource === 2 ? 60 : 30;
    setTotalScore((prev) => prev + gained);
  };

  const moveRoadmap: RoadmapContextType["moveRoadmap"] = (
    roadmapId,
    direction,
  ) => {
    setRoadmaps((prev) => {
      const currentIndex = prev.findIndex((item) => item.id === roadmapId);
      if (currentIndex < 0) {
        return prev;
      }

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      const temp = next[currentIndex];
      next[currentIndex] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const addRoadmap: RoadmapContextType["addRoadmap"] = ({
    goal,
    mode,
    level = "normal",
  }) => {
    const safeGoal = goal.trim();
    if (!safeGoal) {
      return;
    }

    const newRoadmapId = `roadmap-${Date.now()}`;
    const newRoadmap = createRoadmapItem({
      id: newRoadmapId,
      goal: safeGoal,
      mode,
      level,
    });

    setRoadmaps((prev) => [...prev, newRoadmap]);
    setActiveRoadmapId(newRoadmapId);
    setNotifications((prev) => [
      {
        id: `n-add-${Date.now()}`,
        message: `新しい目標「${safeGoal}」のロードマップを作成しました。`,
        time: nowText(),
      },
      ...prev,
    ]);
  };

  const generateRoadmap: RoadmapContextType["generateRoadmap"] = async ({
    goal,
    deadline,
    currentLevel,
    weeklyHours,
    deliverable,
    learningStyle,
    setbacks,
    level = "normal",
  }) => {
    const safeGoal = goal.trim();
    if (!safeGoal) {
      return { success: false };
    }

    setIsGeneratingRoadmap(true);
    setLastGenerateError("");

    try {
      const aiResponse = await generateRoadmapFromAI({
        goal: safeGoal,
        deadline: deadline.trim(),
        currentLevel: currentLevel.trim(),
        weeklyHours: weeklyHours.trim(),
        deliverable: deliverable.trim(),
        learningStyle,
        setbacks: setbacks.trim(),
      });

      const roadmapId = `roadmap-${Date.now()}`;
      const roadmapMilestones: RoadmapMilestoneTemplate[] =
        aiResponse.milestones.map((milestone, milestoneIndex) => {
          const milestoneId = `${roadmapId}-phase-${milestoneIndex + 1}`;

          return {
            id: milestoneId,
            title: milestone.title,
            description: milestone.description,
            tasks: milestone.tasks.map((task, taskIndex) => ({
              id: `${roadmapId}-task-${milestoneIndex + 1}-${taskIndex + 1}`,
              title: task.title,
              description: task.description,
            })),
          };
        });

      const generatedRoadmap = createRoadmapItem({
        id: roadmapId,
        goal: aiResponse.goal || safeGoal,
        mode: "ai-auto",
        level,
        roadmapMilestones,
      });

      setRoadmaps((prev) => [...prev, generatedRoadmap]);
      setActiveRoadmapId(roadmapId);
      setNotifications((prev) => [
        {
          id: `n-ai-${Date.now()}`,
          message: `AIで目標「${generatedRoadmap.goal}」のロードマップを作成しました。`,
          time: nowText(),
        },
        ...prev,
      ]);

      return { success: true, roadmapId };
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "AIロードマップ生成に失敗しました。";
      setLastGenerateError(errorMessage);

      // Final safety net: even if AI call fails unexpectedly,
      // create a baseline roadmap so the flow does not stall.
      const fallbackRoadmapId = `roadmap-${Date.now()}`;
      const fallbackRoadmap = createRoadmapItem({
        id: fallbackRoadmapId,
        goal: safeGoal,
        mode: "ai-auto",
        level,
        roadmapMilestones: [
          {
            id: `${fallbackRoadmapId}-phase-1`,
            title: "現状把握",
            description: "目標達成に向けて必要な情報を整理します。",
            tasks: [
              {
                id: `${fallbackRoadmapId}-task-1-1`,
                title: "目標を明確化",
                description: "期限と達成条件を1文で定義する。",
              },
              {
                id: `${fallbackRoadmapId}-task-1-2`,
                title: "現状を棚卸し",
                description: "今できていることと課題を3つずつ書き出す。",
              },
            ],
          },
          {
            id: `${fallbackRoadmapId}-phase-2`,
            title: "実行計画",
            description: "毎週進めるアクションを決めます。",
            tasks: [
              {
                id: `${fallbackRoadmapId}-task-2-1`,
                title: "週次タスク作成",
                description: "1週間単位の実行タスクを設定する。",
              },
              {
                id: `${fallbackRoadmapId}-task-2-2`,
                title: "振り返り設定",
                description: "週末に進捗確認の時間を15分確保する。",
              },
            ],
          },
        ],
      });

      setRoadmaps((prev) => [...prev, fallbackRoadmap]);
      setActiveRoadmapId(fallbackRoadmapId);
      setNotifications((prev) => [
        {
          id: `n-ai-fallback-${Date.now()}`,
          message: "AI応答が不安定だったため、標準ロードマップで作成しました。",
          time: nowText(),
        },
        ...prev,
      ]);

      return { success: true, roadmapId: fallbackRoadmapId };
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const updateMilestone: RoadmapContextType["updateMilestone"] = ({
    roadmapId,
    milestoneId,
    title,
    subtitle,
  }) => {
    const nextTitle = title.trim();
    const nextSubtitle = subtitle.trim();
    if (!nextTitle || !nextSubtitle) {
      return;
    }

    setRoadmaps((prev) =>
      prev.map((roadmap) => {
        if (roadmap.id !== roadmapId) {
          return roadmap;
        }

        const editTarget = roadmap.milestoneTemplates.find(
          (milestone) => milestone.id === milestoneId,
        );
        const targetTaskId = editTarget?.sourceTaskId;

        return {
          ...roadmap,
          roadmapMilestones: roadmap.roadmapMilestones.map((phase) => ({
            ...phase,
            tasks: phase.tasks.map((task) => {
              if (targetTaskId && task.id === targetTaskId) {
                return {
                  ...task,
                  title: nextTitle,
                  description: nextSubtitle,
                };
              }

              return {
                ...task,
                title: task.title,
                description: task.description,
              };
            }),
          })),
          milestoneTemplates: roadmap.milestoneTemplates.map((milestone) =>
            milestone.id === milestoneId
              ? {
                  ...milestone,
                  title: nextTitle,
                  subtitle: nextSubtitle,
                }
              : milestone,
          ),
        };
      }),
    );

    setNotifications((prev) => [
      {
        id: `n-edit-${Date.now()}`,
        message: `マイルストーンを更新しました。`,
        time: nowText(),
      },
      ...prev,
    ]);
  };

  const clearCurrentMilestone = () => {
    const currentMilestone =
      activeRoadmap.milestoneTemplates[activeRoadmap.completedCount];
    if (!currentMilestone) {
      return;
    }

    setRoadmaps((prev) =>
      prev.map((roadmap) => {
        if (roadmap.id !== activeRoadmap.id) {
          return roadmap;
        }

        return {
          ...roadmap,
          completedCount: Math.min(
            roadmap.completedCount + 1,
            roadmap.milestoneTemplates.length,
          ),
          unlockedMilestoneIds: roadmap.unlockedMilestoneIds.includes(
            currentMilestone.id,
          )
            ? roadmap.unlockedMilestoneIds
            : [...roadmap.unlockedMilestoneIds, currentMilestone.id],
        };
      }),
    );
    setNotifications((prev) => [
      {
        id: `n-unlock-${Date.now()}`,
        message: `「${activeRoadmap.goal}」の「${currentMilestone.title}」を達成。投稿できます。`,
        time: nowText(),
      },
      ...prev,
    ]);

    recordDailyActivity("action");
  };

  const consumePostCredit = (milestoneId: string) => {
    let consumedRoadmapTitle = "";
    let consumedMilestoneTitle = "";
    let consumed = false;

    setRoadmaps((prev) =>
      prev.map((roadmap) => {
        if (!roadmap.unlockedMilestoneIds.includes(milestoneId) || consumed) {
          return roadmap;
        }

        const milestone = roadmap.milestoneTemplates.find(
          (item) => item.id === milestoneId,
        );
        consumedRoadmapTitle = roadmap.goal;
        consumedMilestoneTitle = milestone?.title ?? "マイルストーン";
        consumed = true;

        return {
          ...roadmap,
          unlockedMilestoneIds: roadmap.unlockedMilestoneIds.filter(
            (id) => id !== milestoneId,
          ),
          postedMilestoneIds: [...roadmap.postedMilestoneIds, milestoneId],
        };
      }),
    );

    if (!consumed) {
      return false;
    }

    setNotifications((prev) => [
      {
        id: `n-post-${Date.now()}`,
        message: `「${consumedRoadmapTitle}」の「${consumedMilestoneTitle}」を投稿しました。`,
        time: nowText(),
      },
      ...prev,
    ]);

    recordDailyActivity("milestone-post");

    return true;
  };

  const logout: RoadmapContextType["logout"] = (options) => {
    if (!options?.clearProgress) {
      return;
    }

    setRoadmaps([initialRoadmap]);
    setActiveRoadmapId(initialRoadmap.id);
    setStreakDays(1);
    setLastActivityDate(toDateKey(new Date()));
    setTotalScore(12450);
    setActivityByDate({
      [toDateKey(new Date())]: 1,
    });
    setNotifications([
      {
        id: "n-init",
        message: `最初のマイルストーン「${initialRoadmap.milestoneTemplates[0].title}」が投稿可能です。`,
        time: "今",
      },
    ]);

    void AsyncStorage.removeItem(ROADMAP_STORAGE_KEY);
  };

  return (
    <RoadmapContext.Provider
      value={{
        roadmaps,
        activeRoadmapId,
        activeRoadmap,
        milestones,
        completedCount,
        activePostCredits,
        unlockedMilestoneIds,
        unlockedMilestones,
        activeUnlockedMilestones,
        postedMilestoneIds,
        notifications,
        activityByDate,
        streakDays,
        totalScore,
        level,
        postCredits,
        canCreatePost,
        isGeneratingRoadmap,
        lastGenerateError,
        setActiveRoadmap: setActiveRoadmapId,
        moveRoadmap,
        addRoadmap,
        generateRoadmap,
        updateMilestone,
        recordDailyActivity,
        adjustScore: (delta) => {
          if (!Number.isFinite(delta) || delta === 0) {
            return;
          }
          setTotalScore((prev) => Math.max(0, prev + Math.trunc(delta)));
        },
        logout,
        clearCurrentMilestone,
        consumePostCredit,
      }}
    >
      {children}
    </RoadmapContext.Provider>
  );
};

export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error("useRoadmap must be used inside RoadmapProvider");
  }
  return context;
};
