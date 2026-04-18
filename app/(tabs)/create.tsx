import React from "react";
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { InputField, ScreenContainer } from "../../src/components/common";
import { Text } from "../../src/components/common/Typography";
import { useRoadmap } from "../../src/store/roadmap-context";
import { useTabScrollTop } from "../../src/store/tab-scroll-top-context";

const AnimatedView = Animated.View;

type ShortTermGoal = {
  id: string;
  title: string;
  subtitle: string;
  segmentIndex: number;
  position: number;
};

const PRE_MILESTONE_SEGMENT = -1;

export default function CreateScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const {
    activeRoadmap,
    milestones,
    roadmaps,
    clearCurrentMilestone,
    generateRoadmap,
    addBlankRoadmap,
    updateRoadmapGoal,
    updateMilestone,
    addMilestone,
    moveMilestone,
    notifications,
  } = useRoadmap();
  const { registerScrollToTop } = useTabScrollTop();
  const scrollViewRef = React.useRef<ScrollView | null>(null);

  const renderMilestones = [...milestones].reverse();
  const getMilestonePosition = (index: number) => ({
    top: 120 + index * 180,
    left: index % 2 === 0 ? 34 : 200,
  });

  const buildPathItems = () => {
    const items: Array<
      | { type: "milestone"; milestone: (typeof milestones)[number] }
      | { type: "step"; step: ShortTermGoal }
      | { type: "gap"; gapIndex: number }
    > = [];
    const preMilestoneSteps = shortTermGoals
      .filter((step) => step.segmentIndex === PRE_MILESTONE_SEGMENT)
      .sort((a, b) => a.position - b.position);

    preMilestoneSteps.forEach((step) => {
      items.push({ type: "step", step });
    });

    renderMilestones.forEach((milestone, milestoneIndex) => {
      items.push({ type: "milestone", milestone });

      if (milestoneIndex < renderMilestones.length - 1) {
        const stepsInSegment = shortTermGoals
          .filter((step) => step.segmentIndex === milestoneIndex)
          .sort((a, b) => a.position - b.position);

        if (stepsInSegment.length > 0) {
          stepsInSegment.forEach((step) => {
            items.push({ type: "step", step });
          });
        } else {
          items.push({ type: "gap", gapIndex: milestoneIndex });
        }
      }
    });

    if (renderMilestones.length <= 1) {
      const standaloneSteps = shortTermGoals
        .filter((step) => step.segmentIndex === 0)
        .sort((a, b) => a.position - b.position);
      if (standaloneSteps.length > 0) {
        standaloneSteps.forEach((step) => items.push({ type: "step", step }));
      } else {
        items.push({ type: "gap", gapIndex: 0 });
      }
    }

    return items;
  };

  const [addTarget, setAddTarget] = React.useState<null | "milestone" | "step">(
    null,
  );
  const [addingMilestoneIndex, setAddingMilestoneIndex] = React.useState<
    number | null
  >(null);
  const [addingStepPlacement, setAddingStepPlacement] = React.useState<{
    segmentIndex: number;
    position: number;
  } | null>(
    null,
  );
  const [shortTermGoals, setShortTermGoals] = React.useState<ShortTermGoal[]>([]);
  const [editingStepId, setEditingStepId] = React.useState("");
  const [editStepTitle, setEditStepTitle] = React.useState("");
  const [editStepSubtitle, setEditStepSubtitle] = React.useState("");
  const [newStepTitle, setNewStepTitle] = React.useState("");
  const [newStepSubtitle, setNewStepSubtitle] = React.useState("");
  const [flowStep, setFlowStep] = React.useState<
    "intro" | "aiQuestions" | "loading" | "roadmap"
  >("intro");
  const [goalInput, setGoalInput] = React.useState("");
  const [deadlineInput, setDeadlineInput] = React.useState("");
  const [currentLevelInput, setCurrentLevelInput] = React.useState("");
  const [weeklyHoursInput, setWeeklyHoursInput] = React.useState("");
  const [deliverableInput, setDeliverableInput] = React.useState("");
  const [learningStyle, setLearningStyle] = React.useState<
    "practice" | "theory" | "balanced"
  >("balanced");
  const [setbacksInput, setSetbacksInput] = React.useState("");
  const [wizardStep, setWizardStep] = React.useState(0);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = React.useState("");
  const [editTitle, setEditTitle] = React.useState("");
  const [editSubtitle, setEditSubtitle] = React.useState("");
  const [newMilestoneTitle, setNewMilestoneTitle] = React.useState("");
  const [newMilestoneSubtitle, setNewMilestoneSubtitle] = React.useState("");
  const [showCompletion, setShowCompletion] = React.useState(false);
  const [draggingStepId, setDraggingStepId] = React.useState<string | null>(
    null,
  );
  const [draggingMilestoneId, setDraggingMilestoneId] = React.useState<
    string | null
  >(null);
  const [inlineStepEditId, setInlineStepEditId] = React.useState<string | null>(
    null,
  );
  const [inlineStepTitle, setInlineStepTitle] = React.useState("");
  const [inlineMilestoneEditId, setInlineMilestoneEditId] = React.useState<
    string | null
  >(null);
  const [inlineMilestoneTitle, setInlineMilestoneTitle] = React.useState("");
  const [inlineMilestoneSubtitle, setInlineMilestoneSubtitle] =
    React.useState("");
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [roadmapWidth, setRoadmapWidth] = React.useState(360);
  const editorDockBaseBottom = Platform.OS === "ios" ? 86 : 72;
  const stepDragTranslateY = React.useRef(new Animated.Value(0)).current;
  const stepDragTranslateX = React.useRef(new Animated.Value(0)).current;
  const milestoneDragTranslateY = React.useRef(new Animated.Value(0)).current;
  const stepDragArmedIdRef = React.useRef<string | null>(null);
  const milestoneDragArmedIdRef = React.useRef<string | null>(null);
  const stepIsPanningRef = React.useRef(false);
  const milestoneIsPanningRef = React.useRef(false);
  const currentMilestone = milestones.find(
    (milestone) => milestone.status === "current",
  );
  const progress =
    milestones.length > 0
      ? Math.round((activeRoadmap.completedCount / milestones.length) * 100)
      : 0;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const completionSparkles = React.useMemo(
    () => [
      { top: 18, left: 18, size: 8, rotate: "18deg", delay: 0 },
      { top: 34, right: 26, size: 10, rotate: "-16deg", delay: 120 },
      { top: 110, left: 32, size: 7, rotate: "12deg", delay: 220 },
      { top: 132, right: 34, size: 9, rotate: "-10deg", delay: 80 },
      { top: 220, left: 44, size: 8, rotate: "22deg", delay: 180 },
      { top: 240, right: 46, size: 7, rotate: "-20deg", delay: 40 },
    ],
    [],
  );
  const completionScale = pulseAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [1, 1.06],
  });
  const completionGlowScale = pulseAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [0.94, 1.16],
  });
  const completionGlowOpacity = pulseAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [0.55, 0.95],
  });

  const normalizeStepsInSegments = React.useCallback(
    (steps: ShortTermGoal[]) => {
      const grouped = new Map<number, ShortTermGoal[]>();

      steps.forEach((step) => {
        const current = grouped.get(step.segmentIndex) ?? [];
        current.push(step);
        grouped.set(step.segmentIndex, current);
      });

      return steps.map((step) => {
        const segmentSteps = grouped.get(step.segmentIndex) ?? [];
        const sorted = [...segmentSteps].sort(
          (left, right) => left.position - right.position || left.id.localeCompare(right.id),
        );
        const indexInSegment = sorted.findIndex((segmentStep) => segmentStep.id === step.id);
        const count = sorted.length;

        if (count <= 1 || indexInSegment < 0) {
          return step;
        }

        const position = (indexInSegment + 1) / (count + 1);
        return {
          ...step,
          position: Math.max(0.08, Math.min(0.92, position)),
        };
      });
    },
    [],
  );

  const buildShortTermGoalsFromRoadmap = React.useCallback(() => {
    const templates = activeRoadmap.milestoneTemplates;
    const segmentIndices = [
      PRE_MILESTONE_SEGMENT,
      ...Array.from({ length: Math.max(1, templates.length - 1) }).map(
        (_, index) => index,
      ),
    ];
    const defaultPositions = [0.22, 0.5, 0.78];

    return segmentIndices.flatMap((segmentIndex) => {
      const baseTemplateIndex =
        segmentIndex === PRE_MILESTONE_SEGMENT
          ? 0
          : Math.min(segmentIndex + 1, Math.max(0, templates.length - 1));
      const baseTemplate = templates[baseTemplateIndex];
      const baseTitle =
        segmentIndex === PRE_MILESTONE_SEGMENT
          ? `準備: ${baseTemplate?.title ?? "最初の一歩"}`
          : baseTemplate?.title ?? `短期目標 ${segmentIndex + 1}`;
      const baseSubtitle = baseTemplate?.subtitle ?? "進捗を進めるための短期目標";

      return defaultPositions.map((position, index) => ({
        id: `step-${activeRoadmap.id}-${segmentIndex}-default-${index + 1}`,
        title: `${baseTitle} ${index + 1}`,
        subtitle: baseSubtitle,
        segmentIndex,
        position,
      }));
    });
  }, [activeRoadmap.id, activeRoadmap.milestoneTemplates]);

  const wizardQuestions = [
    {
      title: "目標を入力してください",
      value: goalInput,
      setter: setGoalInput,
      placeholder: "例: 3ヶ月でエンジニア就職",
      required: true,
    },
    {
      title: "期限を入力してください",
      value: deadlineInput,
      setter: setDeadlineInput,
      placeholder: "例: 2025年7月",
      required: false,
    },
    {
      title: "現在のレベルを教えてください",
      value: currentLevelInput,
      setter: setCurrentLevelInput,
      placeholder: "例: 初心者 / 中級者",
      required: true,
    },
    {
      title: "週あたりの学習時間は？",
      value: weeklyHoursInput,
      setter: setWeeklyHoursInput,
      placeholder: "例: 10時間",
      required: true,
    },
    {
      title: "成果物のイメージを入力",
      value: deliverableInput,
      setter: setDeliverableInput,
      placeholder: "例: ポートフォリオサイトを完成させる",
      required: true,
    },
    {
      title: "挫折経験や課題",
      value: setbacksInput,
      setter: setSetbacksInput,
      placeholder: "例: 継続が苦手、時間が足りない",
      required: true,
    },
  ];

  const onChooseAIMode = () => {
    setFlowStep("aiQuestions");
  };

  const onChooseManualMode = () => {
    addBlankRoadmap({ goal: "未設定", level: "normal" });
    setFlowStep("roadmap");
  };

  const onSubmitWizard = async () => {
    const current = wizardQuestions[wizardStep];
    if (current.required && !current.value.trim()) {
      Alert.alert("入力不足", current.title);
      return;
    }

    if (wizardStep < wizardQuestions.length - 1) {
      setWizardStep((prev) => prev + 1);
      return;
    }

    if (!goalInput.trim()) {
      Alert.alert("入力不足", "目標を入力してください。");
      return;
    }

    setFlowStep("loading");
    setIsGenerating(true);
    const result = await generateRoadmap({
      goal: goalInput,
      deadline: deadlineInput,
      currentLevel: currentLevelInput,
      weeklyHours: weeklyHoursInput,
      deliverable: deliverableInput,
      learningStyle,
      setbacks: setbacksInput,
      level: "normal",
    });
    setIsGenerating(false);

    if (result.success) {
      setFlowStep("roadmap");
      setGoalInput("");
      setDeadlineInput("");
      setCurrentLevelInput("");
      setWeeklyHoursInput("");
      setDeliverableInput("");
      setSetbacksInput("");
      setWizardStep(0);
      setLearningStyle("balanced");
    } else {
      setFlowStep("aiQuestions");
      Alert.alert(
        "AI生成に失敗しました",
        "もう一度試すか、手動モードで作成してください。",
      );
    }
  };

  const onBackWizard = () => {
    if (wizardStep > 0) {
      setWizardStep((prev) => prev - 1);
      return;
    }
    setFlowStep("intro");
  };

  const onOpenEdit = (milestoneId: string, title: string, subtitle: string) => {
    setInlineMilestoneEditId(milestoneId);
    setInlineMilestoneTitle(title);
    setInlineMilestoneSubtitle(subtitle);
    setInlineStepEditId(null);
  };

  const onSaveInlineMilestone = (milestoneId: string) => {
    if (!inlineMilestoneTitle.trim() || !inlineMilestoneSubtitle.trim()) {
      Alert.alert("入力不足", "タイトルと補足を入力してください。");
      return;
    }
    updateMilestone({
      roadmapId: activeRoadmap.id,
      milestoneId,
      title: inlineMilestoneTitle.trim(),
      subtitle: inlineMilestoneSubtitle.trim(),
    });
    setInlineMilestoneEditId(null);
    setInlineMilestoneTitle("");
    setInlineMilestoneSubtitle("");
  };

  const onCancelInlineMilestone = () => {
    setInlineMilestoneEditId(null);
    setInlineMilestoneTitle("");
    setInlineMilestoneSubtitle("");
  };

  const onSaveEdit = () => {
    if (!editingMilestoneId) {
      return;
    }
    if (!editTitle.trim() || !editSubtitle.trim()) {
      Alert.alert("入力不足", "タイトルと補足を入力してください。");
      return;
    }
    updateMilestone({
      roadmapId: activeRoadmap.id,
      milestoneId: editingMilestoneId,
      title: editTitle,
      subtitle: editSubtitle,
    });
    setEditingMilestoneId("");
    setEditTitle("");
    setEditSubtitle("");
  };

  const onCancelEdit = () => {
    setEditingMilestoneId("");
    setEditTitle("");
    setEditSubtitle("");
  };

  const onAddMilestone = () => {
    if (!newMilestoneTitle.trim() || !newMilestoneSubtitle.trim()) {
      Alert.alert("入力不足", "マイルストーン名と説明を入力してください。");
      return;
    }
    addMilestone({
      roadmapId: activeRoadmap.id,
      title: newMilestoneTitle.trim(),
      subtitle: newMilestoneSubtitle.trim(),
      insertAt: addingMilestoneIndex ?? undefined,
    });
    setNewMilestoneTitle("");
    setNewMilestoneSubtitle("");
    setAddingMilestoneIndex(null);
  };

  const moveShortTermGoalWithinSegment = React.useCallback(
    (stepId: string, position: number) => {
      setShortTermGoals((prev) => {
        const exists = prev.some((step) => step.id === stepId);
        if (!exists) {
          return prev;
        }

        const safePosition = Math.max(0.06, Math.min(0.94, position));
        const updated = prev.map((step) =>
          step.id === stepId ? { ...step, position: safePosition } : step,
        );

        return normalizeStepsInSegments(updated);
      });
    },
    [normalizeStepsInSegments],
  );

  const onAddStep = () => {
    if (!newStepTitle.trim()) {
      Alert.alert("入力不足", "短期目標名を入力してください。");
      return;
    }
    setShortTermGoals((prev) => {
      const targetSegmentIndex = addingStepPlacement?.segmentIndex ?? 0;
      const targetPosition = addingStepPlacement?.position ?? 0.5;
      const newStep = {
        id: `step-${Date.now()}`,
        title: newStepTitle.trim(),
        subtitle: newStepSubtitle.trim(),
        segmentIndex: targetSegmentIndex,
        position: Math.max(0.06, Math.min(0.94, targetPosition)),
      };
      return normalizeStepsInSegments([...prev, newStep]);
    });
    setNewStepTitle("");
    setNewStepSubtitle("");
    setAddTarget(null);
    setAddingStepPlacement(null);
  };

  const onOpenEditStep = (step: ShortTermGoal) => {
    setInlineStepEditId(step.id);
    setInlineStepTitle(step.title);
    setInlineMilestoneEditId(null);
    setAddTarget(null);
    setAddingStepPlacement(null);
  };

  const onSaveInlineStep = (stepId: string) => {
    if (!inlineStepTitle.trim()) {
      Alert.alert("入力不足", "短期目標名を入力してください。");
      return;
    }
    setShortTermGoals((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, title: inlineStepTitle.trim() } : step,
      ),
    );
    setInlineStepEditId(null);
    setInlineStepTitle("");
  };

  const onCancelInlineStep = () => {
    setInlineStepEditId(null);
    setInlineStepTitle("");
  };

  const onOpenAddStep = (segmentIndex: number, position: number) => {
    setAddTarget("step");
    setAddingStepPlacement({
      segmentIndex: Math.max(0, segmentIndex),
      position: Math.max(0.06, Math.min(0.94, position)),
    });
    setNewStepTitle("");
    setNewStepSubtitle("");
    setEditingStepId("");
  };

  const onOpenAddMilestone = () => {
    setAddTarget("milestone");
    setNewMilestoneTitle("");
    setNewMilestoneSubtitle("");
    setEditingMilestoneId("");
    setAddingMilestoneIndex(null);
  };

  const onOpenAddMilestoneAt = (insertIndex: number) => {
    setAddTarget("milestone");
    setNewMilestoneTitle("");
    setNewMilestoneSubtitle("");
    setEditingMilestoneId("");
    setAddingMilestoneIndex(insertIndex);
  };

  const onCancelAdd = () => {
    setAddTarget(null);
    setAddingStepPlacement(null);
    setAddingMilestoneIndex(null);
    setNewStepTitle("");
    setNewStepSubtitle("");
    setNewMilestoneTitle("");
    setNewMilestoneSubtitle("");
  };

  const onSaveEditStep = () => {
    if (!editingStepId) {
      return;
    }
    if (!editStepTitle.trim() || !editStepSubtitle.trim()) {
      Alert.alert("入力不足", "短期目標名と説明を入力してください。");
      return;
    }
    setShortTermGoals((prev) =>
      prev.map((step) =>
        step.id === editingStepId
          ? {
              ...step,
              title: editStepTitle.trim(),
              subtitle: editStepSubtitle.trim(),
            }
          : step,
      ),
    );
    setEditingStepId("");
    setEditStepTitle("");
    setEditStepSubtitle("");
  };

  const onCancelEditStep = () => {
    setEditingStepId("");
    setEditStepTitle("");
    setEditStepSubtitle("");
  };

  const showIntroScreen = flowStep === "intro";
  const milestoneCount = renderMilestones.length;
  const segmentCount = Math.max(1, milestoneCount - 1);
  const milestoneGap = 840;

  const getMilestoneTop = React.useCallback((orderIndex: number) => {
    return 256 + orderIndex * milestoneGap;
  }, []);

  const getSegmentBounds = React.useCallback(
    (segmentIndex: number) => {
      if (segmentIndex === PRE_MILESTONE_SEGMENT) {
        const stepsInSegment = shortTermGoals.filter(
          (step) => step.segmentIndex === PRE_MILESTONE_SEGMENT,
        ).length;
        const firstMilestoneTop = getMilestoneTop(0);
        const desiredSpan = Math.max(300, stepsInSegment * 96 + 120);
        const endTop = firstMilestoneTop - 180;
        const startTop = Math.max(72, endTop - desiredSpan);
        return {
          startTop,
          endTop,
          span: Math.max(140, endTop - startTop),
        };
      }

      const safeSegmentIndex = Math.max(0, Math.min(segmentCount - 1, segmentIndex));
      const stepsInSegment = shortTermGoals.filter(
        (step) => step.segmentIndex === safeSegmentIndex,
      ).length;
      const startTop = getMilestoneTop(safeSegmentIndex) + 136;
      const hasNextMilestone = safeSegmentIndex + 1 < milestoneCount;
      const nextMilestoneTop = hasNextMilestone
        ? getMilestoneTop(safeSegmentIndex + 1)
        : startTop + 620;
      const desiredSpan = Math.max(560, stepsInSegment * 124 + 260);
      const endTop = hasNextMilestone ? nextMilestoneTop - 136 : startTop + desiredSpan;
      const safeEndTop = Math.max(startTop + desiredSpan, endTop);
      return {
        startTop,
        endTop: safeEndTop,
        span: safeEndTop - startTop,
      };
    },
    [getMilestoneTop, milestoneCount, segmentCount, shortTermGoals],
  );

  React.useEffect(() => {
    setShortTermGoals((prev) =>
      prev.map((step, index) => ({
        ...step,
        segmentIndex:
          step.segmentIndex === PRE_MILESTONE_SEGMENT
            ? PRE_MILESTONE_SEGMENT
            : Math.max(0, Math.min(segmentCount - 1, step.segmentIndex ?? index % segmentCount)),
        position: Math.max(0.06, Math.min(0.94, step.position ?? 0.5)),
      })),
    );
  }, [segmentCount]);

  React.useEffect(() => {
    if (activeRoadmap.mode === "ai-auto") {
      const generated = normalizeStepsInSegments(buildShortTermGoalsFromRoadmap());
      setShortTermGoals(generated);
      return;
    }

    if (activeRoadmap.mode === "manual-level" && shortTermGoals.length === 0) {
      setShortTermGoals([]);
    }
  }, [
    activeRoadmap.id,
    activeRoadmap.mode,
    buildShortTermGoalsFromRoadmap,
    normalizeStepsInSegments,
  ]);

  const pathItems = buildPathItems();
  const lastMilestoneTop = getMilestoneTop(Math.max(0, milestoneCount - 1));
  const roadmapHeight = Math.max(1720, lastMilestoneTop + 1240);
  const roadStartY = 140;

  const cubicValue = (
    p0: number,
    p1: number,
    p2: number,
    p3: number,
    t: number,
  ) => {
    const u = 1 - t;
    return (
      u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
    );
  };

  type RoadSegment = {
    x0: number;
    x1: number;
    x2: number;
    x3: number;
    y0: number;
    y1: number;
    y2: number;
    y3: number;
  };

  const roadGeometry = React.useMemo(() => {
    type SegmentTemplate = {
      length: number;
      x1: number;
      x2: number;
      x3: number;
      cp1Ratio: number;
      cp2Ratio: number;
      startX?: number;
    };

    const initialTemplates: SegmentTemplate[] = [
      {
        startX: 176,
        x1: 204,
        x2: 286,
        x3: 300,
        length: 504,
        cp1Ratio: 116 / 504,
        cp2Ratio: 240 / 504,
      },
      {
        x1: 310,
        x2: 156,
        x3: 82,
        length: 582,
        cp1Ratio: 240 / 582,
        cp2Ratio: 362 / 582,
      },
      {
        x1: 26,
        x2: 126,
        x3: 194,
        length: 444,
        cp1Ratio: 160 / 444,
        cp2Ratio: 338 / 444,
      },
    ];

    const loopTemplates: SegmentTemplate[] = [
      {
        x1: 222,
        x2: 286,
        x3: 300,
        length: 504,
        cp1Ratio: 116 / 504,
        cp2Ratio: 240 / 504,
      },
      {
        x1: 310,
        x2: 156,
        x3: 82,
        length: 582,
        cp1Ratio: 240 / 582,
        cp2Ratio: 362 / 582,
      },
      {
        x1: 26,
        x2: 126,
        x3: 194,
        length: 444,
        cp1Ratio: 160 / 444,
        cp2Ratio: 338 / 444,
      },
    ];

    const segments: RoadSegment[] = [];
    const pathParts: string[] = [];
    let currentY = roadStartY;
    let currentX = 176;

    const appendSegment = (template: SegmentTemplate) => {
      if (typeof template.startX === "number") {
        currentX = template.startX;
      }
      const y0 = currentY;
      const y3 = y0 + template.length;
      const y1 = y0 + template.length * template.cp1Ratio;
      const y2 = y0 + template.length * template.cp2Ratio;

      segments.push({
        x0: currentX,
        x1: template.x1,
        x2: template.x2,
        x3: template.x3,
        y0,
        y1,
        y2,
        y3,
      });

      pathParts.push(
        `C ${template.x1} ${y1} ${template.x2} ${y2} ${template.x3} ${y3}`,
      );

      currentX = template.x3;
      currentY = y3;
    };

    initialTemplates.forEach(appendSegment);

    const targetBottom = roadmapHeight + 260;
    while (currentY < targetBottom) {
      loopTemplates.forEach(appendSegment);
    }

    return {
      segments,
      pathD: `M 176 ${roadStartY} ${pathParts.join(" ")}`,
    };
  }, [roadStartY, roadmapHeight]);

  const getPathXForTop = (top: number) => {
    const segments = roadGeometry.segments;
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    if (!firstSegment || !lastSegment) {
      return roadmapWidth / 2;
    }

    const y = Math.max(firstSegment.y0, Math.min(lastSegment.y3, top + 9));
    const segment =
      segments.find((candidate) => y >= candidate.y0 && y <= candidate.y3) ||
      lastSegment;

    let lower = 0;
    let upper = 1;
    for (let iteration = 0; iteration < 18; iteration += 1) {
      const mid = (lower + upper) / 2;
      const yMid = cubicValue(
        segment.y0,
        segment.y1,
        segment.y2,
        segment.y3,
        mid,
      );
      if (yMid < y) {
        lower = mid;
      } else {
        upper = mid;
      }
    }

    const t = (lower + upper) / 2;
    const widthScale = roadmapWidth / 360;
    return (
      cubicValue(segment.x0, segment.x1, segment.x2, segment.x3, t) * widthScale
    );
  };

  const onResetToIntro = () => {
    setFlowStep("intro");
    setShowCompletion(false);
  };

  React.useEffect(() => {
    if (
      activeRoadmap.milestoneTemplates.length > 0 &&
      activeRoadmap.completedCount >= activeRoadmap.milestoneTemplates.length
    ) {
      setShowCompletion(true);
    }
  }, [activeRoadmap.completedCount, activeRoadmap.milestoneTemplates.length]);

  const onClear = () => {
    if (!currentMilestone) {
      Alert.alert("ロードマップ完了", "すべてのマイルストーンを達成済みです。");
      return;
    }
    clearCurrentMilestone();
    Alert.alert("マイルストーン達成", "通常投稿が1回解放されました。");
  };

  React.useEffect(() => {
    registerScrollToTop("create", () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => registerScrollToTop("create", null);
  }, [registerScrollToTop]);

  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <ScreenContainer
      backgroundColor="#FFFFFF"
      scrollable={false}
      padded={false}
      keyboardAvoiding={false}
    >
      {flowStep === "loading" ? (
        <View style={styles.loaderScreen}>
          <View style={styles.loaderGlyph} />
          <Text style={styles.loaderTitle}>あたなのデータを解析中...</Text>
          <Text style={styles.loaderSubtitle}>
            1,000件の成功事例と照合しています。
          </Text>
        </View>
      ) : showIntroScreen ? (
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>あなたの成長を、確実な物語に。</Text>
          <Text style={styles.introDescription}>
            AIに任せるか、自分で自由に描くかを選択し、未来の航路をつくりましょう。
          </Text>
          <Pressable style={styles.primaryAction} onPress={onChooseAIMode}>
            <Text style={styles.primaryActionText}>AIで目標を設定する</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryAction}
            onPress={onChooseManualMode}
          >
            <Text style={styles.secondaryActionText}>
              自分で白紙のロードマップを作る
            </Text>
          </Pressable>
        </View>
      ) : flowStep === "aiQuestions" ? (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.wizardCard}>
            <Text style={styles.wizardTitle}>AIに送る質問</Text>
            <Text style={styles.wizardLabel}>
              {wizardQuestions[wizardStep].title}
            </Text>
            <InputField
              value={wizardQuestions[wizardStep].value}
              onChangeText={wizardQuestions[wizardStep].setter}
              placeholder={wizardQuestions[wizardStep].placeholder}
              style={styles.wizardInput}
              multiline={wizardStep === 4}
            />
            <View style={styles.wizardFooter}>
              <Pressable
                onPress={onBackWizard}
                style={styles.wizardButtonOutline}
              >
                <Text style={styles.wizardButtonOutlineText}>戻る</Text>
              </Pressable>
              <Pressable onPress={onSubmitWizard} style={styles.wizardButton}>
                <Text style={styles.wizardButtonText}>
                  {wizardStep < wizardQuestions.length - 1
                    ? "次へ"
                    : isGenerating
                      ? "生成中..."
                      : "完了して生成"}
                </Text>
              </Pressable>
            </View>
            <Text
              style={styles.smallHint}
            >{`ステップ ${wizardStep + 1} / ${wizardQuestions.length}`}</Text>
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.topHeader}>
            <View style={styles.brandBlock}>
              <View style={styles.brandIconGrid}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <View key={`bi-${index}`} style={styles.brandIconCell} />
                ))}
              </View>
              <View>
                <Text style={styles.brandTitle}>GROWGRAM</Text>
                <Text style={styles.brandSub}>LIVE SYNCING... 0x4F2A</Text>
              </View>
            </View>
            <View style={styles.topRightActions}>
              <Pressable
                style={styles.avatarButton}
                onPress={() => router.push("/notifications")}
              >
                <Ionicons name="person-outline" size={20} color="#1E293B" />
                {notifications.length > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text
                      style={styles.notificationBadgeText}
                      numberOfLines={1}
                    >
                      {notifications.length}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          </View>

          {showCompletion ? (
            <View style={styles.completionBackdrop} pointerEvents="box-none">
              <AnimatedView
                style={[
                  styles.completionGlow,
                  {
                    opacity: completionGlowOpacity,
                    transform: [{ scale: completionGlowScale }],
                  },
                ]}
              />
              <AnimatedView
                style={[
                  styles.completionOverlay,
                  { transform: [{ scale: completionScale }] },
                ]}
              >
                <View style={styles.completionBadgeWrap}>
                  <View style={styles.completionBadgeRing} />
                  <View style={styles.completionBadge}>
                    <Ionicons name="checkmark" size={30} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.completionTitle}>大目標達成！</Text>
                <Text style={styles.completionText}>
                  全てのマイルストーンをクリアしました。
                </Text>
                <Text style={styles.completionSubText}>
                  最後の目標まで到達しました。次の航路を描きましょう。
                </Text>
                <View style={styles.completionSparkleField}>
                  {completionSparkles.map((sparkle, index) => (
                    <AnimatedView
                      key={`sparkle-${index}`}
                      style={[
                        styles.completionSparkle,
                        {
                          top: sparkle.top,
                          left: sparkle.left,
                          right: sparkle.right,
                          width: sparkle.size,
                          height: sparkle.size,
                          transform: [{ rotate: sparkle.rotate }],
                          opacity: pulseAnim,
                          marginTop: sparkle.delay / 24,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Pressable
                  style={styles.primaryAction}
                  onPress={onResetToIntro}
                >
                  <Text style={styles.primaryActionText}>
                    新しい目標を作成する
                  </Text>
                </Pressable>
              </AnimatedView>
            </View>
          ) : null}

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.content,
              addTarget
                ? {
                    paddingBottom:
                      300 +
                      editorDockBaseBottom +
                      Math.max(0, keyboardHeight - 8),
                  }
                : null,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!(draggingMilestoneId || draggingStepId)}
          >
            <View style={styles.goalHeroCard}>
              <Text style={styles.goalHeroLabel}>
                {activeRoadmap.mode === "manual-level" ? "MANUAL GOAL" : "AI GOAL"}
              </Text>
              {activeRoadmap.mode === "manual-level" ? (
                <InputField
                  value={activeRoadmap.goal === "未設定" ? "" : activeRoadmap.goal}
                  onChangeText={(text) =>
                    updateRoadmapGoal({ roadmapId: activeRoadmap.id, goal: text })
                  }
                  placeholder="例: Webアプリを完成させる"
                  style={styles.goalHeroInput}
                />
              ) : (
                <Text style={styles.goalHeroTitle}>{activeRoadmap.goal}</Text>
              )}
            </View>
            <View
              style={[styles.roadmapWrap, { height: roadmapHeight }]}
              onLayout={(event) => {
                const nextWidth = event.nativeEvent.layout.width;
                if (nextWidth > 0 && Math.abs(nextWidth - roadmapWidth) > 0.5) {
                  setRoadmapWidth(nextWidth);
                }
              }}
            >
              <View style={styles.gridOverlay}>
                {Array.from({ length: Math.ceil(roadmapHeight / 86) + 1 }).map(
                  (_, index) => (
                    <View
                      key={`h-${index}`}
                      style={[styles.gridLineHorizontal, { top: index * 86 }]}
                    />
                  ),
                )}
                {Array.from({ length: 6 }).map((_, index) => (
                  <View
                    key={`v-${index}`}
                    style={[styles.gridLineVertical, { left: index * 60 }]}
                  />
                ))}
              </View>

              <Svg
                style={styles.pathLayer as any}
                viewBox={`0 0 360 ${roadmapHeight}`}
                preserveAspectRatio="none"
              >
                <Path
                  d={roadGeometry.pathD}
                  stroke="#FF5F00"
                  strokeOpacity={0.15}
                  strokeWidth={30}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d={roadGeometry.pathD}
                  stroke="#FF5F00"
                  strokeOpacity={0.24}
                  strokeWidth={16}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d={roadGeometry.pathD}
                  stroke="#FF5F00"
                  strokeDasharray="7 12"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                />
              </Svg>

              <Text style={styles.pathHint}>STRATEGIC GOAL</Text>
              <Text style={styles.pathSubHint}>NEXT SYSTEM UPDATE 14:00</Text>
              {renderMilestones.length === 0 ? (
                <View style={styles.blankHintBox}>
                  <Text style={styles.blankHintTitle}>白紙のロードマップ</Text>
                  <Text style={styles.blankHintText}>
                    道は見えています。ここから短期目標とマイルストーンを追加していきましょう。
                  </Text>
                </View>
              ) : (
                (() => {
                  let milestoneCounter = 0;
                  const milestoneCardOffsets = [96, 20, 116];
                  return pathItems.map((item, index) => {
                    let top = 176 + index * 254;
                    if (item.type === "milestone") {
                      const milestoneIndex = renderMilestones.findIndex(
                        (milestone) => milestone.id === item.milestone.id,
                      );
                      top = getMilestoneTop(Math.max(0, milestoneIndex));
                    } else if (item.type === "step") {
                      const bounds = getSegmentBounds(item.step.segmentIndex);
                      top = bounds.startTop + bounds.span * item.step.position;
                    } else if (item.type === "gap") {
                      const bounds = getSegmentBounds(item.gapIndex);
                      top = bounds.startTop + bounds.span * 0.5;
                    }
                    const curveX = getPathXForTop(top);
                    const left =
                      item.type === "milestone"
                        ? milestoneCardOffsets[milestoneCounter % 3]
                        : item.type === "step"
                          ? Math.max(18, Math.min(252, curveX - 44))
                          : Math.max(14, Math.min(252, curveX - 18));

                    if (item.type === "milestone") {
                      const milestone = item.milestone;
                      const milestoneStageNumber =
                        activeRoadmap.milestoneTemplates.length -
                        milestoneCounter +
                        1;
                      const isCurrent = milestone.status === "current";
                      const isCompleted = milestone.status === "completed";
                      const milestoneIndex =
                        activeRoadmap.milestoneTemplates.findIndex(
                          (template) => template.id === milestone.id,
                        );
                      const canMoveMilestoneUp = milestoneIndex > 0;
                      const canMoveMilestoneDown =
                        milestoneIndex >= 0 &&
                        milestoneIndex <
                          activeRoadmap.milestoneTemplates.length - 1;

                      const milestoneResponder = PanResponder.create({
                        onStartShouldSetPanResponder: () => false,
                        onMoveShouldSetPanResponder: (_, gestureState) =>
                          milestoneDragArmedIdRef.current === milestone.id &&
                          Math.abs(gestureState.dy) > 4,
                        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
                          milestoneDragArmedIdRef.current === milestone.id &&
                          Math.abs(gestureState.dy) > 4,
                        onPanResponderGrant: () => {
                          if (
                            milestoneDragArmedIdRef.current === milestone.id
                          ) {
                            milestoneIsPanningRef.current = true;
                            setDraggingMilestoneId(milestone.id);
                            milestoneDragTranslateY.setValue(0);
                          }
                        },
                        onPanResponderMove: (_, gestureState) => {
                          if (
                            milestoneDragArmedIdRef.current === milestone.id
                          ) {
                            milestoneDragTranslateY.setValue(gestureState.dy);
                          }
                        },
                        onPanResponderRelease: (_, gestureState) => {
                          milestoneIsPanningRef.current = false;
                          const shift = Math.round(gestureState.dy / 210);
                          const targetIndex = Math.max(
                            0,
                            Math.min(
                              activeRoadmap.milestoneTemplates.length - 1,
                              milestoneIndex + shift,
                            ),
                          );

                          if (shift !== 0 && targetIndex !== milestoneIndex) {
                            const direction =
                              targetIndex > milestoneIndex ? "down" : "up";
                            const moveCount = Math.abs(
                              targetIndex - milestoneIndex,
                            );

                            for (
                              let moveIndex = 0;
                              moveIndex < moveCount;
                              moveIndex += 1
                            ) {
                              moveMilestone({
                                roadmapId: activeRoadmap.id,
                                milestoneId: milestone.id,
                                direction,
                              });
                            }
                          }

                          Animated.spring(milestoneDragTranslateY, {
                            toValue: 0,
                            useNativeDriver: true,
                            speed: 18,
                            bounciness: 6,
                          }).start(() => {
                            setDraggingMilestoneId((current) =>
                              current === milestone.id ? null : current,
                            );
                            if (
                              milestoneDragArmedIdRef.current === milestone.id
                            ) {
                              milestoneDragArmedIdRef.current = null;
                            }
                          });
                        },
                        onPanResponderTerminate: () => {
                          milestoneIsPanningRef.current = false;
                          Animated.timing(milestoneDragTranslateY, {
                            toValue: 0,
                            duration: 150,
                            useNativeDriver: true,
                          }).start(() => {
                            setDraggingMilestoneId((current) =>
                              current === milestone.id ? null : current,
                            );
                            if (
                              milestoneDragArmedIdRef.current === milestone.id
                            ) {
                              milestoneDragArmedIdRef.current = null;
                            }
                          });
                        },
                        onPanResponderTerminationRequest: () => false,
                        onShouldBlockNativeResponder: () => true,
                      });
                      milestoneCounter += 1;

                      return (
                        <Animated.View
                          key={milestone.id}
                          style={[
                            styles.stageCard,
                            { top, left },
                            draggingMilestoneId === milestone.id
                              ? {
                                  transform: [
                                    { translateY: milestoneDragTranslateY },
                                    { scale: 1.03 },
                                  ],
                                  zIndex: 9,
                                }
                              : null,
                            draggingMilestoneId === milestone.id
                              ? styles.stageCardDragging
                              : null,
                            milestoneCounter % 2 === 0
                              ? styles.stageCardAccentLeft
                              : undefined,
                          ]}
                        >
                          <Pressable
                            style={styles.stagePressable}
                            {...milestoneResponder.panHandlers}
                            onPress={() => {
                              if (
                                milestoneDragArmedIdRef.current === milestone.id
                              ) {
                                return;
                              }
                              router.push({
                                pathname: "/goal-description",
                                params: {
                                  goalType: "milestone",
                                  goalId: milestone.id,
                                  title: milestone.title,
                                  subtitle: milestone.subtitle,
                                },
                              });
                            }}
                            onPressIn={() => {
                              if (milestoneIsPanningRef.current) {
                                return;
                              }
                            }}
                            delayLongPress={180}
                            onLongPress={() => {
                              milestoneDragArmedIdRef.current = milestone.id;
                              setDraggingMilestoneId(milestone.id);
                              milestoneDragTranslateY.setValue(0);
                            }}
                            onPressOut={() => {
                              requestAnimationFrame(() => {
                                if (milestoneIsPanningRef.current) {
                                  return;
                                }
                                if (
                                  milestoneDragArmedIdRef.current ===
                                  milestone.id
                                ) {
                                  milestoneDragArmedIdRef.current = null;
                                }
                                setDraggingMilestoneId((current) =>
                                  current === milestone.id ? null : current,
                                );
                                milestoneDragTranslateY.setValue(0);
                              });
                            }}
                          >
                            <View style={styles.stageBadgeRow}>
                              <View style={styles.stageBadgeIconWrap}>
                                <Ionicons
                                  name={
                                    isCompleted
                                      ? "trophy-outline"
                                      : "flag-outline"
                                  }
                                  size={14}
                                  color="#FF5F00"
                                />
                              </View>
                              <Text
                                style={styles.stageBadgeText}
                              >{`STAGE ${String(milestoneStageNumber).padStart(
                                2,
                                "0",
                              )}`}</Text>
                              <View style={styles.stageBadgeActions}>
                                <Pressable
                                  style={[
                                    styles.stageOrderButton,
                                    !canMoveMilestoneUp &&
                                      styles.orderButtonDisabled,
                                  ]}
                                  disabled={!canMoveMilestoneUp}
                                  onPress={() =>
                                    onOpenEdit(
                                      milestone.id,
                                      milestone.title,
                                      milestone.subtitle,
                                    )
                                  }
                                >
                                  <Ionicons
                                    name="pencil"
                                    size={12}
                                    color="#FF5F00"
                                  />
                                </Pressable>
                                <Pressable
                                  style={[
                                    styles.stageOrderButton,
                                    !canMoveMilestoneUp &&
                                      styles.orderButtonDisabled,
                                  ]}
                                  disabled={!canMoveMilestoneUp}
                                  onPress={() =>
                                    moveMilestone({
                                      roadmapId: activeRoadmap.id,
                                      milestoneId: milestone.id,
                                      direction: "up",
                                    })
                                  }
                                >
                                  <Ionicons
                                    name="chevron-up"
                                    size={12}
                                    color={
                                      canMoveMilestoneUp
                                        ? "#FF5F00"
                                        : "rgba(255,95,0,0.35)"
                                    }
                                  />
                                </Pressable>
                                <Pressable
                                  style={[
                                    styles.stageOrderButton,
                                    !canMoveMilestoneDown &&
                                      styles.orderButtonDisabled,
                                  ]}
                                  disabled={!canMoveMilestoneDown}
                                  onPress={() =>
                                    moveMilestone({
                                      roadmapId: activeRoadmap.id,
                                      milestoneId: milestone.id,
                                      direction: "down",
                                    })
                                  }
                                >
                                  <Ionicons
                                    name="chevron-down"
                                    size={12}
                                    color={
                                      canMoveMilestoneDown
                                        ? "#FF5F00"
                                        : "rgba(255,95,0,0.35)"
                                    }
                                  />
                                </Pressable>
                              </View>
                            </View>
                            {inlineMilestoneEditId === milestone.id ? (
                              <View style={styles.inlineMilestoneEditor}>
                                <TextInput
                                  value={inlineMilestoneTitle}
                                  onChangeText={setInlineMilestoneTitle}
                                  placeholder="長期目標名"
                                  style={styles.inlineMilestoneTitleInput}
                                />
                                <TextInput
                                  value={inlineMilestoneSubtitle}
                                  onChangeText={setInlineMilestoneSubtitle}
                                  placeholder="補足説明"
                                  style={styles.inlineMilestoneSubtitleInput}
                                  multiline
                                />
                                <View style={styles.inlineEditActionRow}>
                                  <Pressable
                                    style={styles.inlineActionButton}
                                    onPress={onCancelInlineMilestone}
                                  >
                                    <Ionicons
                                      name="close"
                                      size={14}
                                      color="#FF5F00"
                                    />
                                  </Pressable>
                                  <Pressable
                                    style={styles.inlineActionButton}
                                    onPress={() =>
                                      onSaveInlineMilestone(milestone.id)
                                    }
                                  >
                                    <Ionicons
                                      name="checkmark"
                                      size={14}
                                      color="#FF5F00"
                                    />
                                  </Pressable>
                                </View>
                              </View>
                            ) : (
                              <>
                                <Text
                                  style={[
                                    styles.stageTitle,
                                    isCurrent && styles.currentTitle,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {milestone.title}
                                </Text>
                                <Text style={styles.stageSubtitle}>
                                  {milestone.subtitle}
                                </Text>
                              </>
                            )}
                            <View style={styles.stageFooterRow}>
                              <Text style={styles.stageFooterKey}>
                                EFFICIENCY
                              </Text>
                              <Text
                                style={styles.stageFooterValue}
                              >{`${Math.min(
                                98,
                                58 + milestoneCounter * 11,
                              )}%`}</Text>
                            </View>
                          </Pressable>
                        </Animated.View>
                      );
                    }

                    if (item.type === "step") {
                      const segmentBounds = getSegmentBounds(item.step.segmentIndex);
                      const dotMinX = 12;
                      const dotMaxX = Math.max(dotMinX, roadmapWidth - 26);
                      const dotLeft = Math.max(
                        dotMinX,
                        Math.min(dotMaxX, curveX),
                      );
                      const stepAnchorLeft = dotLeft - 9;
                      const sideMargin = 16;
                      const iconSlot = 0;
                      const rightSpace = roadmapWidth - dotLeft - sideMargin - iconSlot;
                      const leftSpace = dotLeft - sideMargin - iconSlot;
                      const estimatedLabelWidth = Math.max(
                        132,
                        Math.min(320, Math.round(item.step.title.length * 12 + 30)),
                      );
                      const canPlaceRight = rightSpace >= estimatedLabelWidth;
                      const canPlaceLeft = leftSpace >= estimatedLabelWidth;
                      const placeLabelRight = canPlaceRight
                        ? !canPlaceLeft || rightSpace >= leftSpace
                        : !canPlaceLeft;
                      const activeSpace = placeLabelRight ? rightSpace : leftSpace;
                      const labelWidth = Math.max(
                        132,
                        Math.min(estimatedLabelWidth, Math.floor(activeSpace)),
                      );

                      const stepResponder = PanResponder.create({
                        onStartShouldSetPanResponder: () => false,
                        onMoveShouldSetPanResponder: (_, gestureState) =>
                          stepDragArmedIdRef.current === item.step.id &&
                          Math.abs(gestureState.dy) > 4,
                        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
                          stepDragArmedIdRef.current === item.step.id &&
                          Math.abs(gestureState.dy) > 4,
                        onPanResponderGrant: () => {
                          if (stepDragArmedIdRef.current === item.step.id) {
                            stepIsPanningRef.current = true;
                            setDraggingStepId(item.step.id);
                            stepDragTranslateX.setValue(0);
                            stepDragTranslateY.setValue(0);
                          }
                        },
                        onPanResponderMove: (_, gestureState) => {
                          if (stepDragArmedIdRef.current === item.step.id) {
                            const nextTop = Math.max(
                              segmentBounds.startTop,
                              Math.min(segmentBounds.endTop, top + gestureState.dy),
                            );
                            const nextCurveX = getPathXForTop(nextTop);
                            const nextDotLeft = Math.max(
                              dotMinX,
                              Math.min(dotMaxX, nextCurveX),
                            );
                            const nextStepAnchorLeft = nextDotLeft - 9;
                            stepDragTranslateX.setValue(
                              nextStepAnchorLeft - stepAnchorLeft,
                            );
                            stepDragTranslateY.setValue(nextTop - top);
                          }
                        },
                        onPanResponderRelease: (_, gestureState) => {
                          stepIsPanningRef.current = false;
                          const nextTop = Math.max(
                            segmentBounds.startTop,
                            Math.min(segmentBounds.endTop, top + gestureState.dy),
                          );
                          const nextPosition =
                            (nextTop - segmentBounds.startTop) /
                            segmentBounds.span;
                          moveShortTermGoalWithinSegment(item.step.id, nextPosition);

                          Animated.parallel([
                            Animated.spring(stepDragTranslateX, {
                              toValue: 0,
                              useNativeDriver: true,
                              speed: 18,
                              bounciness: 6,
                            }),
                            Animated.spring(stepDragTranslateY, {
                              toValue: 0,
                              useNativeDriver: true,
                              speed: 18,
                              bounciness: 6,
                            }),
                          ]).start(() => {
                            setDraggingStepId((current) =>
                              current === item.step.id ? null : current,
                            );
                            if (stepDragArmedIdRef.current === item.step.id) {
                              stepDragArmedIdRef.current = null;
                            }
                          });
                        },
                        onPanResponderTerminate: () => {
                          stepIsPanningRef.current = false;
                          Animated.parallel([
                            Animated.timing(stepDragTranslateX, {
                              toValue: 0,
                              duration: 150,
                              useNativeDriver: true,
                            }),
                            Animated.timing(stepDragTranslateY, {
                              toValue: 0,
                              duration: 150,
                              useNativeDriver: true,
                            }),
                          ]).start(() => {
                            setDraggingStepId((current) =>
                              current === item.step.id ? null : current,
                            );
                            if (stepDragArmedIdRef.current === item.step.id) {
                              stepDragArmedIdRef.current = null;
                            }
                          });
                        },
                        onPanResponderTerminationRequest: () => false,
                        onShouldBlockNativeResponder: () => true,
                      });

                      return (
                        <Animated.View
                          key={item.step.id}
                          style={[
                            styles.stepAnchor,
                            { top, left: stepAnchorLeft },
                            draggingStepId === item.step.id
                              ? {
                                  transform: [
                                    { translateX: stepDragTranslateX },
                                    { translateY: stepDragTranslateY },
                                    { scale: 1.08 },
                                  ],
                                }
                              : null,
                            draggingStepId === item.step.id
                              ? styles.stepAnchorDragging
                              : null,
                          ]}
                          {...stepResponder.panHandlers}
                        >
                          <Pressable
                            style={[
                              styles.microDotContainer,
                              draggingStepId === item.step.id
                                ? styles.microDotContainerDragging
                                : null,
                            ]}
                            onPressIn={() => {
                              if (stepIsPanningRef.current) {
                                return;
                              }
                            }}
                            delayLongPress={180}
                            onLongPress={() => {
                              stepDragArmedIdRef.current = item.step.id;
                              setDraggingStepId(item.step.id);
                              stepDragTranslateX.setValue(0);
                              stepDragTranslateY.setValue(0);
                            }}
                            onPressOut={() => {
                              requestAnimationFrame(() => {
                                if (stepIsPanningRef.current) {
                                  return;
                                }
                                if (
                                  stepDragArmedIdRef.current === item.step.id
                                ) {
                                  stepDragArmedIdRef.current = null;
                                }
                                setDraggingStepId((current) =>
                                  current === item.step.id ? null : current,
                                );
                                stepDragTranslateX.setValue(0);
                                stepDragTranslateY.setValue(0);
                              });
                            }}
                          >
                            <View style={styles.microDot} />
                          </Pressable>
                          <View
                            style={[
                              styles.microInfoRow,
                              { width: labelWidth },
                              placeLabelRight
                                ? styles.microInfoRight
                                : styles.microInfoLeft,
                            ]}
                          >
                            <Pressable
                              style={[
                                styles.microLabelPressable,
                                { width: labelWidth },
                              ]}
                              onPress={() => {
                                if (
                                  stepDragArmedIdRef.current === item.step.id
                                ) {
                                  return;
                                }
                                router.push({
                                  pathname: "/goal-description",
                                  params: {
                                    goalType: "step",
                                    goalId: item.step.id,
                                    title: item.step.title,
                                    subtitle: item.step.subtitle,
                                  },
                                });
                              }}
                              delayLongPress={180}
                              onLongPress={() => {
                                stepDragArmedIdRef.current = item.step.id;
                                setDraggingStepId(item.step.id);
                                stepDragTranslateX.setValue(0);
                                stepDragTranslateY.setValue(0);
                              }}
                              onPressOut={() => {
                                requestAnimationFrame(() => {
                                  if (stepIsPanningRef.current) {
                                    return;
                                  }
                                  if (
                                    stepDragArmedIdRef.current === item.step.id
                                  ) {
                                    stepDragArmedIdRef.current = null;
                                  }
                                  setDraggingStepId((current) =>
                                    current === item.step.id ? null : current,
                                  );
                                  stepDragTranslateX.setValue(0);
                                  stepDragTranslateY.setValue(0);
                                });
                              }}
                            >
                              <Text
                                style={[
                                  styles.microLabel,
                                  draggingStepId === item.step.id
                                    ? styles.microLabelDragging
                                    : null,
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="clip"
                              >
                                {item.step.title}
                              </Text>
                            </Pressable>
                          </View>
                        </Animated.View>
                      );
                    }

                    const milestoneInsertIndex = Math.max(
                      0,
                      Math.min(
                        activeRoadmap.milestoneTemplates.length,
                        activeRoadmap.milestoneTemplates.length -
                          (item.gapIndex + 1),
                      ),
                    );
                    return (
                      <View
                        key={`gap-${item.gapIndex}`}
                        style={[styles.stepGap, { top, left }]}
                      >
                        <Pressable
                          style={styles.stepGapButton}
                          onPress={() =>
                            onOpenAddMilestoneAt(milestoneInsertIndex)
                          }
                        >
                          <Ionicons name="add" size={14} color="#FF5F00" />
                          <Text style={styles.gapTypeText}>M</Text>
                        </Pressable>
                      </View>
                    );
                  });
                })()
              )}
              {Array.from({ length: segmentCount }).map((_, segmentIndex) => {
                const bounds = getSegmentBounds(segmentIndex);
                const addTop = bounds.startTop + bounds.span * 0.5;
                const addX = getPathXForTop(addTop);
                const addLeft = Math.max(
                  12,
                  Math.min(roadmapWidth - 34, addX + 26),
                );

                return (
                  <Pressable
                    key={`segment-add-${segmentIndex}`}
                    style={[styles.segmentAddButton, { top: addTop - 14, left: addLeft }]}
                    onPress={() => onOpenAddStep(segmentIndex, 0.5)}
                  >
                    <Ionicons name="add" size={14} color="#FF5F00" />
                  </Pressable>
                );
              })}
              <Pressable style={styles.pathFab} onPress={onOpenAddMilestone}>
                <Ionicons name="add" size={30} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.fauxFooter}>
              <Pressable onPress={onResetToIntro}>
                <Text style={styles.linkText}>最初に戻る</Text>
              </Pressable>
              <Pressable onPress={onClear}>
                <Text style={styles.linkText}>
                  現在のマイルストーンをクリア
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {addTarget ? (
            <View
              pointerEvents="box-none"
              style={[
                styles.floatingEditorDock,
                {
                  bottom:
                    editorDockBaseBottom + Math.max(0, keyboardHeight - 8),
                },
              ]}
            >
              <View style={styles.compactEditorPanel}>
                <Text style={styles.compactEditorTitle}>
                  {addTarget === "milestone"
                    ? addingMilestoneIndex !== null
                      ? `マイルストーンを追加（位置: ${addingMilestoneIndex + 1}）`
                      : "マイルストーンを追加（末尾）"
                    : `短期目標を追加（区間: ${(addingStepPlacement?.segmentIndex ?? 0) + 1}, 位置: ${Math.round((addingStepPlacement?.position ?? 0.5) * 100)}%）`}
                </Text>
                <InputField
                  value={
                    addTarget === "milestone" ? newMilestoneTitle : newStepTitle
                  }
                  onChangeText={
                    addTarget === "milestone"
                      ? setNewMilestoneTitle
                      : setNewStepTitle
                  }
                  placeholder={
                    addTarget === "milestone"
                      ? "マイルストーン名"
                      : "短期目標名"
                  }
                  style={styles.addInput}
                />
                <InputField
                  value={
                    addTarget === "milestone"
                      ? newMilestoneSubtitle
                      : newStepSubtitle
                  }
                  onChangeText={
                    addTarget === "milestone"
                      ? setNewMilestoneSubtitle
                      : setNewStepSubtitle
                  }
                  placeholder="補足説明"
                  style={styles.addInput}
                  multiline
                />
                <View style={styles.editActions}>
                  <Pressable
                    style={styles.editButtonOutline}
                    onPress={onCancelAdd}
                  >
                    <Text style={styles.editButtonOutlineText}>キャンセル</Text>
                  </Pressable>
                  <Pressable
                    style={styles.editButton}
                    onPress={
                      addTarget === "milestone" ? onAddMilestone : onAddStep
                    }
                  >
                    <Text style={styles.editButtonText}>追加する</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}
        </>
      )}
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    topHeader: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(120,120,120,0.16)",
      backgroundColor: "#F7F7F7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    brandBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    brandIconGrid: {
      width: 22,
      height: 22,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 2,
    },
    brandIconCell: {
      width: 10,
      height: 10,
      borderRadius: 2,
      backgroundColor: "#694035",
    },
    brandTitle: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: 3,
      fontWeight: "400",
      color: "#222222",
    },
    brandSub: {
      marginTop: 1,
      color: "#9A8E8A",
      fontSize: 10,
      letterSpacing: 1.2,
      fontWeight: "500",
    },
    topRightActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatarButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#E8EEF5",
      borderWidth: 1,
      borderColor: "rgba(72,87,105,0.22)",
    },
    notificationBadge: {
      position: "absolute",
      top: -5,
      right: -5,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#FF5F00",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },
    content: {
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 120,
    },
    roadmapWrap: {
      height: 1720,
      position: "relative",
      marginBottom: 26,
      backgroundColor: "#FAFAFA",
      overflow: "hidden",
    },
    gridOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "transparent",
    },
    gridLineHorizontal: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: "rgba(44,62,80,0.08)",
      opacity: 0.35,
    },
    gridLineVertical: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: "rgba(44,62,80,0.08)",
      opacity: 0.25,
    },
    loaderScreen: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: "#FFFFFF",
    },
    loaderGlyph: {
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 2,
      borderColor: "rgba(255,95,0,0.3)",
      backgroundColor: "rgba(255,95,0,0.05)",
      marginBottom: 28,
      shadowColor: "#FF5F00",
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 30,
      elevation: 4,
    },
    loaderTitle: {
      color: "#2C3E50",
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 10,
      textAlign: "center",
    },
    loaderSubtitle: {
      color: "#2C3E50",
      opacity: 0.7,
      fontSize: 14,
      textAlign: "center",
      maxWidth: 260,
    },
    completionOverlay: {
      position: "absolute",
      top: 110,
      left: 20,
      right: 20,
      padding: 24,
      borderRadius: 32,
      backgroundColor: "rgba(255,255,255,0.98)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.18)",
      shadowColor: "#FF5F00",
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 16 },
      shadowRadius: 36,
      elevation: 10,
      zIndex: 12,
      overflow: "visible",
      alignItems: "center",
    },
    completionBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 11,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    completionGlow: {
      position: "absolute",
      top: 88,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: "rgba(255,95,0,0.16)",
      shadowColor: "#FF5F00",
      shadowOpacity: 0.3,
      shadowRadius: 48,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    completionBadgeWrap: {
      position: "relative",
      width: 86,
      height: 86,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    completionBadgeRing: {
      position: "absolute",
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 2,
      borderColor: "rgba(255,95,0,0.24)",
      backgroundColor: "rgba(255,95,0,0.08)",
    },
    completionBadge: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FF5F00",
      shadowColor: "#FF5F00",
      shadowOpacity: 0.42,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 16,
      elevation: 8,
    },
    completionSubText: {
      color: "#2C3E50",
      opacity: 0.75,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      marginBottom: 16,
      maxWidth: 260,
    },
    completionSparkleField: {
      position: "relative",
      width: "100%",
      height: 280,
      marginBottom: 10,
    },
    completionSparkle: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: "#FFB36A",
      shadowColor: "#FF5F00",
      shadowOpacity: 0.24,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 2,
    },
    completionTitle: {
      color: "#FF5F00",
      fontSize: 24,
      fontWeight: "800",
      marginBottom: 10,
      textAlign: "center",
    },
    completionText: {
      color: "#2C3E50",
      opacity: 0.8,
      fontSize: 15,
      lineHeight: 24,
      textAlign: "center",
      marginBottom: 8,
      maxWidth: 270,
    },
    goalHeroCard: {
      marginHorizontal: 16,
      marginTop: 18,
      marginBottom: 30,
      paddingHorizontal: 18,
      paddingVertical: 18,
      borderRadius: 26,
      backgroundColor: "rgba(255,255,255,0.98)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.16)",
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 24,
      elevation: 2,
    },
    goalHeroLabel: {
      color: "#FF5F00",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 2.2,
      marginBottom: 10,
    },
    goalHeroTitle: {
      color: "#1F2937",
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "700",
    },
    goalHeroInput: {
      minHeight: 58,
      fontSize: 20,
    },
    editPanel: {
      marginTop: 24,
      marginHorizontal: 16,
      padding: 20,
      borderRadius: 22,
      backgroundColor: "rgba(248,249,250,0.96)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.16)",
    },
    editPanelTitle: {
      color: "#2C3E50",
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 12,
    },
    editInput: {
      minHeight: 48,
      marginTop: 12,
    },
    editActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 16,
    },
    editButton: {
      backgroundColor: "#FF5F00",
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    editButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    editButtonOutline: {
      borderWidth: 1,
      borderColor: "#FF5F00",
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    editButtonOutlineText: {
      color: "#FF5F00",
      fontWeight: "700",
    },
    addPanel: {
      marginTop: 24,
      marginHorizontal: 16,
      padding: 20,
      borderRadius: 22,
      backgroundColor: "rgba(248,249,250,0.94)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.14)",
    },
    addModeBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: 16,
      marginTop: 24,
    },
    modeButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.18)",
      backgroundColor: "rgba(255,255,255,0.95)",
      alignItems: "center",
      justifyContent: "center",
    },
    modeButtonActive: {
      backgroundColor: "rgba(255,95,0,0.14)",
      borderColor: "#FF5F00",
    },
    modeButtonText: {
      color: "#2C3E50",
      fontSize: 14,
      fontWeight: "700",
    },
    modeButtonTextActive: {
      color: "#FF5F00",
    },
    addPanelTitle: {
      color: "#2C3E50",
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 12,
      opacity: 0.9,
    },
    addInput: {
      minHeight: 48,
      marginTop: 12,
    },
    addButton: {
      marginTop: 16,
      backgroundColor: "#FF5F00",
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    },
    addButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    nodeCardWrapper: {
      width: 180,
      alignItems: "center",
    },
    editBadge: {
      position: "absolute",
      right: 12,
      top: 12,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: "rgba(255,95,0,0.12)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    },
    pathLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    introContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
      backgroundColor: "#FFFFFF",
    },
    introTitle: {
      color: "#2C3E50",
      fontSize: 32,
      fontWeight: "700",
      lineHeight: 42,
      textAlign: "center",
      marginBottom: 18,
    },
    introDescription: {
      color: "#2C3E50",
      fontSize: 15,
      fontWeight: "300",
      textAlign: "center",
      opacity: 0.82,
      marginBottom: 36,
    },
    primaryAction: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: "#FF5F00",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    primaryActionText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    secondaryAction: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#FF5F00",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,95,0,0.06)",
    },
    secondaryActionText: {
      color: "#FF5F00",
      fontSize: 15,
      fontWeight: "700",
    },
    wizardCard: {
      marginTop: 24,
      marginHorizontal: 16,
      padding: 24,
      borderRadius: 24,
      backgroundColor: "rgba(248,249,250,0.96)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.16)",
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 20,
      elevation: 2,
    },
    wizardTitle: {
      color: "#2C3E50",
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 16,
    },
    wizardLabel: {
      color: "#2C3E50",
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 12,
      opacity: 0.95,
    },
    wizardInput: {
      minHeight: 56,
      textAlignVertical: "top",
    },
    wizardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
    wizardButton: {
      backgroundColor: "#FF5F00",
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    wizardButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    wizardButtonOutline: {
      borderWidth: 1,
      borderColor: "#FF5F00",
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    wizardButtonOutlineText: {
      color: "#FF5F00",
      fontSize: 14,
      fontWeight: "700",
    },
    smallHint: {
      marginTop: 12,
      color: "#2C3E50",
      opacity: 0.7,
      fontSize: 12,
    },
    blankHintBox: {
      position: "absolute",
      top: 260,
      left: 32,
      right: 32,
      padding: 24,
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.92)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.14)",
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 30,
      elevation: 2,
    },
    blankHintTitle: {
      color: "#2C3E50",
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
    },
    blankHintText: {
      color: "#2C3E50",
      fontSize: 13,
      fontWeight: "300",
      opacity: 0.8,
      lineHeight: 20,
    },
    stepAnchor: {
      position: "absolute",
      zIndex: 4,
    },
    stepAnchorDragging: {
      zIndex: 12,
    },
    microStep: {
      position: "absolute",
      flexDirection: "row",
      alignItems: "center",
      maxWidth: 190,
      zIndex: 4,
    },
    microInfoRow: {
      position: "absolute",
      flexDirection: "row",
      alignItems: "center",
      top: -2,
      overflow: "visible",
    },
    microInfoRight: {
      left: 52,
    },
    microInfoLeft: {
      right: 52,
      flexDirection: "row",
    },
    microLabelPressable: {
      alignSelf: "flex-start",
    },
    microDotContainer: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,95,0,0.12)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.22)",
    },
    microDotContainerDragging: {
      backgroundColor: "rgba(255,95,0,0.28)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.52)",
      shadowColor: "#FF5F00",
      shadowOpacity: 0.42,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 10,
    },
    microDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FF5F00",
      shadowColor: "#FF5F00",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 4,
    },
    microLabel: {
      color: "rgba(54,54,54,0.9)",
      fontSize: 11,
      fontWeight: "500",
      backgroundColor: "rgba(255,255,255,0.86)",
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: "rgba(60,60,60,0.08)",
      flexShrink: 1,
      flexWrap: "wrap",
      lineHeight: 16,
    },
    microLabelDragging: {
      backgroundColor: "rgba(255,255,255,0.98)",
      borderColor: "rgba(255,95,0,0.34)",
      shadowColor: "#FF5F00",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
      elevation: 6,
      color: "#1F2937",
    },
    stepActionButton: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.95)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.28)",
    },
    orderButtonDisabled: {
      opacity: 0.45,
    },
    stepGap: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      minWidth: 44,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255,95,0,0.1)",
      paddingHorizontal: 6,
      zIndex: 4,
    },
    segmentAddButton: {
      position: "absolute",
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.96)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.44)",
      shadowColor: "#FF5F00",
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 5 },
      shadowRadius: 8,
      elevation: 6,
      zIndex: 6,
    },
    stepGapButton: {
      width: 34,
      height: 20,
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.95)",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 2,
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.34)",
    },
    gapTypeText: {
      color: "#FF5F00",
      fontSize: 10,
      fontWeight: "700",
    },
    pathHint: {
      position: "absolute",
      top: 152,
      left: 126,
      color: "#D44C00",
      fontSize: 16,
      letterSpacing: 3,
      fontWeight: "700",
    },
    pathSubHint: {
      position: "absolute",
      top: 180,
      left: 132,
      color: "rgba(80,80,80,0.58)",
      fontSize: 12,
      letterSpacing: 0.7,
      fontWeight: "500",
    },
    stageCard: {
      position: "absolute",
      width: 262,
      minHeight: 172,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(65,65,65,0.08)",
      backgroundColor: "rgba(255,255,255,0.95)",
      shadowColor: "#3F3F3F",
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 22,
      elevation: 3,
      zIndex: 3,
    },
    stageCardDragging: {
      borderColor: "rgba(255,95,0,0.45)",
      shadowColor: "#FF5F00",
      shadowOpacity: 0.28,
      shadowOffset: { width: 0, height: 16 },
      shadowRadius: 24,
      elevation: 12,
      backgroundColor: "rgba(255,255,255,0.99)",
    },
    stageCardAccentLeft: {
      borderLeftWidth: 4,
      borderLeftColor: "#FF5F00",
    },
    stagePressable: {
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    stageBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 10,
    },
    stageBadgeActions: {
      marginLeft: "auto",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    stageOrderButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.96)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.28)",
    },
    stageBadgeIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,95,0,0.13)",
    },
    stageBadgeText: {
      color: "#E35300",
      fontSize: 12,
      letterSpacing: 2,
      fontWeight: "700",
    },
    stageTitle: {
      color: "#121212",
      fontSize: 36,
      lineHeight: 42,
      fontWeight: "700",
      marginBottom: 6,
    },
    stageSubtitle: {
      color: "rgba(35,35,35,0.84)",
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400",
      marginBottom: 12,
    },
    stageFooterRow: {
      borderTopWidth: 1,
      borderTopColor: "rgba(60,60,60,0.12)",
      paddingTop: 10,
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    stageFooterKey: {
      color: "rgba(60,60,60,0.55)",
      fontSize: 11,
      letterSpacing: 1,
      fontWeight: "600",
    },
    stageFooterValue: {
      color: "#E35300",
      fontSize: 14,
      fontWeight: "700",
    },
    inlineMilestoneEditor: {
      marginBottom: 8,
      gap: 8,
    },
    inlineMilestoneTitleInput: {
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.28)",
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.98)",
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 16,
      fontWeight: "700",
      color: "#202020",
    },
    inlineMilestoneSubtitleInput: {
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.22)",
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.96)",
      paddingHorizontal: 10,
      paddingVertical: 8,
      minHeight: 64,
      fontSize: 13,
      lineHeight: 18,
      color: "#2C3E50",
      textAlignVertical: "top",
    },
    inlineEditActionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
    inlineActionButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.96)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    inlineStepInput: {
      minWidth: 120,
      maxWidth: 170,
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.28)",
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.96)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 11,
      fontWeight: "600",
      color: "#2C3E50",
    },
    compactEditorPanel: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: "rgba(248,249,250,0.96)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.16)",
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 24,
      elevation: 8,
    },
    floatingEditorDock: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 16,
      zIndex: 20,
    },
    compactEditorTitle: {
      color: "#2C3E50",
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 12,
    },
    nodeGroup: {
      position: "absolute",
      alignItems: "center",
      width: 180,
    },
    placeholderNode: {
      width: 180,
      alignItems: "center",
      justifyContent: "center",
    },
    placeholderCard: {
      width: 180,
      minHeight: 70,
      borderRadius: 20,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: "rgba(255,95,0,0.24)",
      backgroundColor: "rgba(255,255,255,0.92)",
      padding: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      color: "#FF5F00",
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
      opacity: 0.9,
    },
    pulseRing: {
      position: "absolute",
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.25)",
      opacity: 0.6,
    },
    hexagon: {
      marginBottom: 12,
    },
    nodeCard: {
      width: 180,
      minHeight: 128,
      padding: 18,
      backgroundColor: "rgba(248,249,250,0.88)",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.14)",
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 18,
      elevation: 2,
    },
    nodeMeta: {
      color: "#FF5F00",
      fontSize: 11,
      letterSpacing: 1,
      fontWeight: "700",
      marginBottom: 10,
    },
    nodeTitle: {
      color: "#2C3E50",
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "700",
      marginBottom: 6,
    },
    currentTitle: {
      color: "#FF5F00",
    },
    nodeSub: {
      color: "#2C3E50",
      fontSize: 13,
      fontWeight: "300",
      opacity: 0.8,
      lineHeight: 20,
    },
    pathFab: {
      position: "absolute",
      left: "50%",
      bottom: 26,
      marginLeft: -28,
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: "#FF6B00",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#FF6B00",
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 18,
      elevation: 8,
      zIndex: 7,
    },
    fauxFooter: {
      gap: 16,
      marginTop: 10,
      marginHorizontal: 16,
      marginBottom: 20,
    },
    linkText: {
      color: "#FF5F00",
      textDecorationLine: "underline",
      textDecorationColor: "#FF5F00",
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 10,
    },
  });
