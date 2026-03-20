import React, { createContext, useContext, useMemo, useState } from 'react';

type MilestoneBase = {
  id: string;
  roadmapId: string;
  roadmapGoal: string;
  title: string;
  subtitle: string;
};

type Milestone = MilestoneBase & {
  status: 'locked' | 'current' | 'completed';
};

type RoadmapLevel = 'easy' | 'normal' | 'hard';
type BuildMode = 'ai-auto' | 'manual-level';

type RoadmapItem = {
  id: string;
  goal: string;
  mode: BuildMode;
  level: RoadmapLevel;
  milestoneTemplates: { id: string; title: string; subtitle: string }[];
  completedCount: number;
  unlockedMilestoneIds: string[];
  postedMilestoneIds: string[];
};

type AppNotification = {
  id: string;
  message: string;
  time: string;
};

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
  postCredits: number;
  canCreatePost: boolean;
  setActiveRoadmap: (roadmapId: string) => void;
  moveRoadmap: (roadmapId: string, direction: 'up' | 'down') => void;
  addRoadmap: (params: { goal: string; mode: BuildMode; level?: RoadmapLevel }) => void;
  updateMilestone: (params: { roadmapId: string; milestoneId: string; title: string; subtitle: string }) => void;
  clearCurrentMilestone: () => void;
  consumePostCredit: (milestoneId: string) => boolean;
};

const levelToCount: Record<RoadmapLevel, number> = {
  easy: 3,
  normal: 5,
  hard: 7,
};

const nowText = () => '今';

const estimateAICount = (goal: string) => {
  const lengthWeight = Math.max(0, Math.floor(goal.trim().length / 14));
  const hardKeyword = /起業|転職|プロ|上級|英語|フルスタック|資格|独立|研究/i.test(goal) ? 1 : 0;
  return Math.min(8, Math.max(4, 4 + lengthWeight + hardKeyword));
};

const generateMilestoneTemplates = (roadmapId: string, goal: string, count: number) => {
  const normalizedGoal = goal.trim() || '目標';
  return Array.from({ length: count }).map((_, index) => {
    const step = index + 1;
    const phase = index === 0 ? '理解' : index < count - 1 ? '実践' : '達成';
    return {
      id: `${roadmapId}-m${step}`,
      title: `${normalizedGoal} - Step ${step}`,
      subtitle: `${phase}フェーズ`,
    };
  });
};

const createRoadmapItem = (params: { id: string; goal: string; mode: BuildMode; level: RoadmapLevel }) => {
  const milestoneCount = params.mode === 'ai-auto' ? estimateAICount(params.goal) : levelToCount[params.level];
  const milestoneTemplates = generateMilestoneTemplates(params.id, params.goal, milestoneCount);

  return {
    id: params.id,
    goal: params.goal,
    mode: params.mode,
    level: params.level,
    milestoneTemplates,
    completedCount: 0,
    unlockedMilestoneIds: [] as string[],
    postedMilestoneIds: [] as string[],
  } satisfies RoadmapItem;
};

const initialRoadmap = createRoadmapItem({
  id: 'roadmap-1',
  goal: 'Full-stack Developerになる',
  mode: 'manual-level',
  level: 'normal',
});

initialRoadmap.completedCount = 1;
initialRoadmap.unlockedMilestoneIds = [initialRoadmap.milestoneTemplates[0].id];

const RoadmapContext = createContext<RoadmapContextType | null>(null);

export const RoadmapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([initialRoadmap]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string>(initialRoadmap.id);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'n-init',
      message: `最初のマイルストーン「${initialRoadmap.milestoneTemplates[0].title}」が投稿可能です。`,
      time: '今',
    },
  ]);

  const activeRoadmap = useMemo(() => {
    return roadmaps.find((roadmap) => roadmap.id === activeRoadmapId) ?? roadmaps[0] ?? initialRoadmap;
  }, [activeRoadmapId, roadmaps]);

  const milestones = useMemo<Milestone[]>(() => {
    return activeRoadmap.milestoneTemplates.map((milestone, index) => {
      if (index < activeRoadmap.completedCount) {
        return {
          ...milestone,
          roadmapId: activeRoadmap.id,
          roadmapGoal: activeRoadmap.goal,
          status: 'completed',
        };
      }

      if (index === activeRoadmap.completedCount) {
        return {
          ...milestone,
          roadmapId: activeRoadmap.id,
          roadmapGoal: activeRoadmap.goal,
          status: 'current',
        };
      }

      return {
        ...milestone,
        roadmapId: activeRoadmap.id,
        roadmapGoal: activeRoadmap.goal,
        status: 'locked',
      };
    });
  }, [activeRoadmap]);

  const unlockedMilestones = useMemo(() => {
    return roadmaps.flatMap((roadmap) =>
      roadmap.milestoneTemplates
        .filter((milestone) => roadmap.unlockedMilestoneIds.includes(milestone.id))
        .map((milestone) => ({
          ...milestone,
          roadmapId: roadmap.id,
          roadmapGoal: roadmap.goal,
        }))
    );
  }, [roadmaps]);

  const activeUnlockedMilestones = useMemo(() => {
    return unlockedMilestones.filter((milestone) => milestone.roadmapId === activeRoadmap.id);
  }, [activeRoadmap.id, unlockedMilestones]);

  const unlockedMilestoneIds = activeRoadmap.unlockedMilestoneIds;
  const postedMilestoneIds = activeRoadmap.postedMilestoneIds;
  const completedCount = activeRoadmap.completedCount;
  const activePostCredits = activeRoadmap.unlockedMilestoneIds.length;

  const postCredits = unlockedMilestones.length;
  const canCreatePost = postCredits > 0;

  const moveRoadmap: RoadmapContextType['moveRoadmap'] = (roadmapId, direction) => {
    setRoadmaps((prev) => {
      const currentIndex = prev.findIndex((item) => item.id === roadmapId);
      if (currentIndex < 0) {
        return prev;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
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

  const addRoadmap: RoadmapContextType['addRoadmap'] = ({ goal, mode, level = 'normal' }) => {
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

  const updateMilestone: RoadmapContextType['updateMilestone'] = ({ roadmapId, milestoneId, title, subtitle }) => {
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

        return {
          ...roadmap,
          milestoneTemplates: roadmap.milestoneTemplates.map((milestone) =>
            milestone.id === milestoneId
              ? {
                  ...milestone,
                  title: nextTitle,
                  subtitle: nextSubtitle,
                }
              : milestone
          ),
        };
      })
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
    const currentMilestone = activeRoadmap.milestoneTemplates[activeRoadmap.completedCount];
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
          completedCount: Math.min(roadmap.completedCount + 1, roadmap.milestoneTemplates.length),
          unlockedMilestoneIds: roadmap.unlockedMilestoneIds.includes(currentMilestone.id)
            ? roadmap.unlockedMilestoneIds
            : [...roadmap.unlockedMilestoneIds, currentMilestone.id],
        };
      })
    );
    setNotifications((prev) => [
      {
        id: `n-unlock-${Date.now()}`,
        message: `「${activeRoadmap.goal}」の「${currentMilestone.title}」を達成。投稿できます。`,
        time: nowText(),
      },
      ...prev,
    ]);
  };

  const consumePostCredit = (milestoneId: string) => {
    let consumedRoadmapTitle = '';
    let consumedMilestoneTitle = '';
    let consumed = false;

    setRoadmaps((prev) =>
      prev.map((roadmap) => {
        if (!roadmap.unlockedMilestoneIds.includes(milestoneId) || consumed) {
          return roadmap;
        }

        const milestone = roadmap.milestoneTemplates.find((item) => item.id === milestoneId);
        consumedRoadmapTitle = roadmap.goal;
        consumedMilestoneTitle = milestone?.title ?? 'マイルストーン';
        consumed = true;

        return {
          ...roadmap,
          unlockedMilestoneIds: roadmap.unlockedMilestoneIds.filter((id) => id !== milestoneId),
          postedMilestoneIds: [...roadmap.postedMilestoneIds, milestoneId],
        };
      })
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

    return true;
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
        postCredits,
        canCreatePost,
        setActiveRoadmap: setActiveRoadmapId,
        moveRoadmap,
        addRoadmap,
        updateMilestone,
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
    throw new Error('useRoadmap must be used inside RoadmapProvider');
  }
  return context;
};
