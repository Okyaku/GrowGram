import React from "react";
import {
  Alert,
  Animated,
  Dimensions,
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
import DateTimePicker from "@react-native-community/datetimepicker";
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
  isCompleted: boolean;
};

type WizardQuestionBase = {
  title: string;
  required: boolean;
};

type TextWizardQuestion = WizardQuestionBase & {
  kind: "text";
  value: string;
  setter: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
};

type ChoiceWizardQuestion = WizardQuestionBase & {
  kind: "choice";
  value: string;
  setter: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
  options: string[];
  otherValue: string;
  otherSetter: React.Dispatch<React.SetStateAction<string>>;
};

type DateWizardQuestion = WizardQuestionBase & {
  kind: "date";
  value: string;
  setter: React.Dispatch<React.SetStateAction<string>>;
  selectedDate: Date | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
};

type WizardQuestion =
  | TextWizardQuestion
  | ChoiceWizardQuestion
  | DateWizardQuestion;

const PRE_MILESTONE_SEGMENT = -1;

export default function CreateScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const {
    activeRoadmap,
    milestones,
    roadmaps,
    lastGenerateError,
    clearCurrentMilestone,
    generateRoadmap,
    addBlankRoadmap,
    updateRoadmapGoal,
    updateMilestone,
    addMilestone,
    deleteMilestone,
    moveMilestone,
    archiveRoadmap,
  } = useRoadmap();
  const { registerScrollToTop } = useTabScrollTop();
  const scrollViewRef = React.useRef<ScrollView | null>(null);
  const initialRoadmapScrollDoneRef = React.useRef<string | null>(null);

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

    renderMilestones.forEach((milestone, milestoneIndex) => {
      items.push({ type: "milestone", milestone });

      if (milestoneIndex < renderMilestones.length - 1) {
        const stepsInSegment = shortTermGoals.filter(
          (step) => step.segmentIndex === milestoneIndex,
        );

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
      const standaloneSteps = shortTermGoals.filter(
        (step) => step.segmentIndex === 0,
      );
      if (standaloneSteps.length > 0) {
        standaloneSteps.forEach((step) => items.push({ type: "step", step }));
      } else {
        items.push({ type: "gap", gapIndex: 0 });
      }
    }

    const preMilestoneSteps = shortTermGoals.filter(
      (step) => step.segmentIndex === PRE_MILESTONE_SEGMENT,
    );

    preMilestoneSteps.forEach((step) => {
      items.push({ type: "step", step });
    });

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
  } | null>(null);
  const [shortTermGoals, setShortTermGoals] = React.useState<ShortTermGoal[]>(
    [],
  );
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
  const [deadlineDate, setDeadlineDate] = React.useState<Date | null>(null);
  const [showDeadlinePicker, setShowDeadlinePicker] = React.useState(false);
  const [currentLevelInput, setCurrentLevelInput] = React.useState("");
  const [currentLevelOtherInput, setCurrentLevelOtherInput] =
    React.useState("");
  const [weeklyHoursInput, setWeeklyHoursInput] = React.useState("");
  const [weeklyHoursOtherInput, setWeeklyHoursOtherInput] = React.useState("");
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
  const addButtonDragTranslateX = React.useRef(new Animated.Value(0)).current;
  const addButtonDragTranslateY = React.useRef(new Animated.Value(0)).current;
  const stepDragArmedIdRef = React.useRef<string | null>(null);
  const milestoneDragArmedIdRef = React.useRef<string | null>(null);
  const addButtonDragArmedIdRef = React.useRef<string | null>(null);
  const addButtonDidDragRef = React.useRef(false);
  const stepIsPanningRef = React.useRef(false);
  const milestoneIsPanningRef = React.useRef(false);
  const addButtonIsPanningRef = React.useRef(false);
  const [draggingAddButtonId, setDraggingAddButtonId] = React.useState<
    string | null
  >(null);
  const [addButtonOffsets, setAddButtonOffsets] = React.useState<
    Record<string, { x: number; y: number }>
  >({});
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
        const indexInSegment = segmentSteps.findIndex(
          (segmentStep) => segmentStep.id === step.id,
        );
        const count = segmentSteps.length;

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
    const segmentTotal = Math.max(1, templates.length - 1);
    const lastTemplateIndex = Math.max(0, templates.length - 1);
    const segmentIndices = [
      PRE_MILESTONE_SEGMENT,
      ...Array.from({ length: segmentTotal }).map((_, index) => index),
    ];
    const defaultPositions = [0.22, 0.5, 0.78];

    return segmentIndices.flatMap((segmentIndex) => {
      const baseTemplateIndex =
        segmentIndex === PRE_MILESTONE_SEGMENT
          ? 0
          : Math.max(
              0,
              Math.min(lastTemplateIndex, templates.length - segmentIndex - 1),
            );
      const baseTemplate = templates[baseTemplateIndex];
      const segmentNumber =
        segmentIndex === PRE_MILESTONE_SEGMENT ? 0 : baseTemplateIndex + 1;
      const baseTitle =
        segmentIndex === PRE_MILESTONE_SEGMENT
          ? `準備: ${baseTemplate?.title ?? "最初の一歩"}`
          : (baseTemplate?.title ?? `短期目標 ${segmentNumber}`);
      const baseSubtitle =
        baseTemplate?.subtitle ?? "進捗を進めるための短期目標";

      return defaultPositions.map((position, index) => ({
        id: `step-${activeRoadmap.id}-${segmentIndex}-default-${index + 1}`,
        title: `${baseTitle} ${index + 1}`,
        subtitle: baseSubtitle,
        segmentIndex,
        position,
        isCompleted: false,
      }));
    });
  }, [activeRoadmap.id, activeRoadmap.milestoneTemplates]);

  const wizardQuestions: WizardQuestion[] = [
    {
      kind: "text",
      title: "目標を入力してください",
      value: goalInput,
      setter: setGoalInput,
      placeholder: "例: 3ヶ月でエンジニア就職",
      required: true,
    },
    {
      kind: "date",
      title: "期限を入力してください",
      value: deadlineInput,
      setter: setDeadlineInput,
      required: true,
      selectedDate: deadlineDate,
      setSelectedDate: setDeadlineDate,
    },
    {
      kind: "choice",
      title: "現在のレベルを教えてください",
      value: currentLevelInput,
      setter: setCurrentLevelInput,
      otherValue: currentLevelOtherInput,
      otherSetter: setCurrentLevelOtherInput,
      placeholder: "選択してください",
      required: true,
      options: ["初心者", "少し経験あり", "中級者", "上級者", "その他"],
    },
    {
      kind: "choice",
      title: "週あたりの学習時間は？",
      value: weeklyHoursInput,
      setter: setWeeklyHoursInput,
      otherValue: weeklyHoursOtherInput,
      otherSetter: setWeeklyHoursOtherInput,
      placeholder: "選択してください",
      required: true,
      options: ["3時間", "5時間", "10時間", "15時間", "20時間", "その他"],
    },
    {
      kind: "text",
      title: "成果物のイメージを入力",
      value: deliverableInput,
      setter: setDeliverableInput,
      placeholder: "例: ポートフォリオサイトを完成させる",
      required: true,
    },
    {
      kind: "text",
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

  const currentWizardQuestion = wizardQuestions[wizardStep];

  const formatDeadlineDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  const resolveWizardValue = (question: WizardQuestion) => {
    if (question.kind === "choice") {
      return question.value === "その他"
        ? question.otherValue.trim()
        : question.value.trim();
    }

    return question.value.trim();
  };

  const onSubmitWizard = async () => {
    const current = currentWizardQuestion;
    const resolvedValue = resolveWizardValue(current);

    if (current.required && !resolvedValue) {
      if (current.kind === "choice" && current.value === "その他") {
        Alert.alert(
          "入力不足",
          `${current.title}の「その他」を入力してください。`,
        );
        return;
      }
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
      currentLevel:
        currentLevelInput === "その他"
          ? currentLevelOtherInput.trim()
          : currentLevelInput,
      weeklyHours:
        weeklyHoursInput === "その他"
          ? weeklyHoursOtherInput.trim()
          : weeklyHoursInput,
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
      setDeadlineDate(null);
      setShowDeadlinePicker(false);
      setCurrentLevelInput("");
      setCurrentLevelOtherInput("");
      setWeeklyHoursInput("");
      setWeeklyHoursOtherInput("");
      setDeliverableInput("");
      setSetbacksInput("");
      setWizardStep(0);
      setLearningStyle("balanced");
    } else {
      setFlowStep("aiQuestions");
      Alert.alert(
        "AI生成に失敗しました",
        lastGenerateError || "もう一度試すか、手動モードで作成してください。",
      );
    }
  };

  const onBackWizard = () => {
    if (wizardStep > 0) {
      setShowDeadlinePicker(false);
      setWizardStep((prev) => prev - 1);
      return;
    }
    setShowDeadlinePicker(false);
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
        isCompleted: false,
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

  const onToggleStepCompleted = (stepId: string) => {
    setShortTermGoals((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? {
              ...step,
              isCompleted: !step.isCompleted,
            }
          : step,
      ),
    );
  };

  const onDeleteStep = (stepId: string) => {
    Alert.alert("短期目標を削除", "この短期目標を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          setShortTermGoals((prev) =>
            prev.filter((step) => step.id !== stepId),
          );
        },
      },
    ]);
  };

  const onDeleteMilestone = (milestoneId: string) => {
    Alert.alert("マイルストーンを削除", "このマイルストーンを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          deleteMilestone({
            roadmapId: activeRoadmap.id,
            milestoneId,
          });
        },
      },
    ]);
  };

  const clampAddButtonOffset = (
    baseX: number,
    baseY: number,
    deltaX: number,
    deltaY: number,
    buttonSize: { width: number; height: number },
  ) => {
    const maxX = Math.max(0, roadmapWidth - buttonSize.width - baseX);
    const maxY = Math.max(0, roadmapHeight - buttonSize.height - baseY);
    return {
      x: Math.max(-baseX, Math.min(maxX, deltaX)),
      y: Math.max(-baseY, Math.min(maxY, deltaY)),
    };
  };

  const updateAddButtonOffset = (
    buttonId: string,
    deltaX: number,
    deltaY: number,
    buttonSize: { width: number; height: number },
    baseX: number,
    baseY: number,
  ) => {
    const nextOffset = clampAddButtonOffset(
      baseX,
      baseY,
      deltaX,
      deltaY,
      buttonSize,
    );
    setAddButtonOffsets((prev) => ({
      ...prev,
      [buttonId]: nextOffset,
    }));
  };

  const resetAddButtonDrag = () => {
    addButtonIsPanningRef.current = false;
    addButtonDragArmedIdRef.current = null;
    setDraggingAddButtonId(null);
    addButtonDragTranslateX.setValue(0);
    addButtonDragTranslateY.setValue(0);
    requestAnimationFrame(() => {
      addButtonDidDragRef.current = false;
    });
  };

  const onOpenAddStep = (segmentIndex: number, position: number) => {
    setAddTarget("step");
    setAddingStepPlacement({
      segmentIndex:
        segmentIndex === PRE_MILESTONE_SEGMENT
          ? PRE_MILESTONE_SEGMENT
          : Math.max(0, segmentIndex),
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
  const milestoneCardClearance = 300;

  const getMilestoneTop = React.useCallback((orderIndex: number) => {
    return 256 + orderIndex * milestoneGap;
  }, []);

  const getSegmentBounds = React.useCallback(
    (segmentIndex: number) => {
      if (segmentIndex === PRE_MILESTONE_SEGMENT) {
        const stepsInSegment = shortTermGoals.filter(
          (step) => step.segmentIndex === PRE_MILESTONE_SEGMENT,
        ).length;
        const stageOneTop =
          milestoneCount > 0
            ? getMilestoneTop(milestoneCount - 1)
            : getMilestoneTop(0);
        const startTop = stageOneTop + milestoneCardClearance;
        const desiredSpan = Math.max(240, stepsInSegment * 96 + 120);
        const endTop = startTop + desiredSpan;
        return {
          startTop,
          endTop,
          span: Math.max(160, endTop - startTop),
        };
      }

      const safeSegmentIndex = Math.max(
        0,
        Math.min(segmentCount - 1, segmentIndex),
      );
      const stepsInSegment = shortTermGoals.filter(
        (step) => step.segmentIndex === safeSegmentIndex,
      ).length;
      const startTop =
        getMilestoneTop(safeSegmentIndex) + milestoneCardClearance;
      const hasNextMilestone = safeSegmentIndex + 1 < milestoneCount;
      const nextMilestoneTop = hasNextMilestone
        ? getMilestoneTop(safeSegmentIndex + 1)
        : startTop + 620;
      const desiredSpan = Math.max(220, stepsInSegment * 104 + 140);
      const endTop = hasNextMilestone
        ? nextMilestoneTop - milestoneCardClearance
        : startTop + desiredSpan;
      const safeEndTop = Math.max(startTop + desiredSpan, endTop);
      return {
        startTop,
        endTop: safeEndTop,
        span: safeEndTop - startTop,
      };
    },
    [
      getMilestoneTop,
      milestoneCardClearance,
      milestoneCount,
      segmentCount,
      shortTermGoals,
    ],
  );

  const getStepPlacementFromTop = React.useCallback(
    (top: number) => {
      const segmentIndices = [
        PRE_MILESTONE_SEGMENT,
        ...Array.from({ length: segmentCount }).map((_, index) => index),
      ];

      let closestSegment = PRE_MILESTONE_SEGMENT;
      let closestDistance = Number.POSITIVE_INFINITY;
      let closestBounds = getSegmentBounds(PRE_MILESTONE_SEGMENT);

      for (const segmentIndex of segmentIndices) {
        const bounds = getSegmentBounds(segmentIndex);
        if (top >= bounds.startTop && top <= bounds.endTop) {
          const directPosition =
            1 - (top - bounds.startTop) / Math.max(1, bounds.span);
          return {
            segmentIndex,
            position: Math.max(0.06, Math.min(0.94, directPosition)),
          };
        }

        const distance =
          top < bounds.startTop
            ? bounds.startTop - top
            : top > bounds.endTop
              ? top - bounds.endTop
              : 0;

        if (distance < closestDistance) {
          closestDistance = distance;
          closestSegment = segmentIndex;
          closestBounds = bounds;
        }
      }

      const clampedTop = Math.max(
        closestBounds.startTop,
        Math.min(closestBounds.endTop, top),
      );
      const nextPosition =
        1 -
        (clampedTop - closestBounds.startTop) / Math.max(1, closestBounds.span);
      return {
        segmentIndex: closestSegment,
        position: Math.max(0.06, Math.min(0.94, nextPosition)),
      };
    },
    [getSegmentBounds, segmentCount],
  );

  const projectToRoadFromTop = React.useCallback(
    (top: number) => {
      const placement = getStepPlacementFromTop(top);
      const bounds = getSegmentBounds(placement.segmentIndex);
      const projectedTop =
        bounds.startTop + bounds.span * (1 - placement.position);

      return {
        segmentIndex: placement.segmentIndex,
        position: placement.position,
        top: projectedTop,
      };
    },
    [getSegmentBounds, getStepPlacementFromTop],
  );

  const moveShortTermGoalFreely = React.useCallback(
    (stepId: string, droppedTop: number) => {
      const projectedPlacement = projectToRoadFromTop(droppedTop);

      setShortTermGoals((prev) => {
        const moving = prev.find((step) => step.id === stepId);
        if (!moving) {
          return prev;
        }

        const others = prev.filter((step) => step.id !== stepId);
        const targetSegment = projectedPlacement.segmentIndex;
        const bounds = getSegmentBounds(targetSegment);

        const segmentOrdered = others.filter(
          (step) => step.segmentIndex === targetSegment,
        );

        let insertInSegment = segmentOrdered.length;
        for (let index = 0; index < segmentOrdered.length; index += 1) {
          const step = segmentOrdered[index];
          const stepTop = bounds.startTop + bounds.span * (1 - step.position);
          if (droppedTop < stepTop) {
            insertInSegment = index;
            break;
          }
        }

        const firstIndexInAll = others.findIndex(
          (step) => step.segmentIndex === targetSegment,
        );
        const segmentIndicesInAll = others
          .map((step, index) => ({ step, index }))
          .filter((entry) => entry.step.segmentIndex === targetSegment)
          .map((entry) => entry.index);

        let insertAt = others.length;
        if (segmentIndicesInAll.length > 0) {
          if (insertInSegment <= 0) {
            insertAt = segmentIndicesInAll[0];
          } else if (insertInSegment >= segmentIndicesInAll.length) {
            insertAt = segmentIndicesInAll[segmentIndicesInAll.length - 1] + 1;
          } else {
            insertAt = segmentIndicesInAll[insertInSegment];
          }
        } else if (firstIndexInAll >= 0) {
          insertAt = firstIndexInAll;
        }

        const next = [...others];
        next.splice(insertAt, 0, {
          ...moving,
          segmentIndex: targetSegment,
          position: projectedPlacement.position,
        });

        return next;
      });
    },
    [getSegmentBounds, projectToRoadFromTop],
  );

  const onAutoAlignShortTermGoals = React.useCallback(() => {
    let changedCount = 0;

    setShortTermGoals((prev) => {
      if (prev.length <= 1) {
        changedCount = 0;
        return prev;
      }

      const grouped = new Map<
        number,
        Array<{ id: string; position: number; originalIndex: number }>
      >();
      prev.forEach((step, index) => {
        const current = grouped.get(step.segmentIndex) ?? [];
        current.push({
          id: step.id,
          position: step.position,
          originalIndex: index,
        });
        grouped.set(step.segmentIndex, current);
      });

      const alignedPositionById = new Map<string, number>();
      grouped.forEach((steps, segmentIndex) => {
        const bounds = getSegmentBounds(segmentIndex);

        // Sort by current on-screen Y (top -> bottom), then normalize spacing only.
        const ordered = [...steps].sort((left, right) => {
          const leftTop = bounds.startTop + bounds.span * (1 - left.position);
          const rightTop = bounds.startTop + bounds.span * (1 - right.position);

          if (Math.abs(leftTop - rightTop) > 0.001) {
            return leftTop - rightTop;
          }
          return left.originalIndex - right.originalIndex;
        });

        const count = ordered.length;
        ordered.forEach((step, index) => {
          const alignedProgress =
            count <= 1 ? 0.5 : 1 - (index + 1) / (count + 1);
          alignedPositionById.set(
            step.id,
            Math.max(0.08, Math.min(0.92, alignedProgress)),
          );
        });
      });

      const aligned = prev.map((step) => ({
        ...step,
        position: alignedPositionById.get(step.id) ?? step.position,
      }));

      changedCount = prev.reduce((count, step, index) => {
        const next = aligned[index];
        if (!next) {
          return count;
        }

        const movedSegment = step.segmentIndex !== next.segmentIndex;
        const movedPosition = Math.abs(step.position - next.position) > 0.0001;
        return movedSegment || movedPosition ? count + 1 : count;
      }, 0);

      return aligned;
    });

    requestAnimationFrame(() => {
      Alert.alert(
        "自動整頓",
        changedCount > 0
          ? `${changedCount}件の短期目標を整頓しました。`
          : "並びはすでに整っています。",
      );
    });
  }, [getSegmentBounds]);

  const onOpenRoadmapOverview = React.useCallback(() => {
    const overviewMilestones = milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      subtitle: milestone.subtitle,
      status: milestone.status,
      roadmapId: milestone.roadmapId,
      roadmapGoal: milestone.roadmapGoal,
    }));

    router.push({
      pathname: "/roadmap-overview",
      params: {
        goal: activeRoadmap.goal,
        milestonesJson: JSON.stringify(overviewMilestones),
      },
    });
  }, [activeRoadmap.goal, milestones, router]);

  React.useEffect(() => {
    setShortTermGoals((prev) =>
      prev.map((step, index) => ({
        ...step,
        segmentIndex:
          step.segmentIndex === PRE_MILESTONE_SEGMENT
            ? PRE_MILESTONE_SEGMENT
            : Math.max(
                0,
                Math.min(
                  segmentCount - 1,
                  step.segmentIndex ?? index % segmentCount,
                ),
              ),
        position: Math.max(0.06, Math.min(0.94, step.position ?? 0.5)),
      })),
    );
  }, [segmentCount]);

  React.useEffect(() => {
    if (activeRoadmap.mode === "ai-auto") {
      const generated = normalizeStepsInSegments(
        buildShortTermGoalsFromRoadmap(),
      );
      setShortTermGoals(generated);
      return;
    }

    if (activeRoadmap.mode === "manual-level") {
      setShortTermGoals([]);
    }
  }, [
    activeRoadmap.id,
    activeRoadmap.mode,
    buildShortTermGoalsFromRoadmap,
    normalizeStepsInSegments,
  ]);

  React.useEffect(() => {
    setAddButtonOffsets({});
    resetAddButtonDrag();
  }, [activeRoadmap.id]);

  const pathItems = buildPathItems();
  const lastMilestoneTop = getMilestoneTop(Math.max(0, milestoneCount - 1));
  const preSegmentBounds = getSegmentBounds(PRE_MILESTONE_SEGMENT);
  const roadmapHeight = Math.max(
    980,
    Math.max(lastMilestoneTop + 520, preSegmentBounds.endTop + 180),
  );
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

  function getPathXForTop(top: number) {
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
  }

  const onResetToIntro = () => {
    setFlowStep("intro");
    setShowCompletion(false);
  };

  const onArchiveCurrentRoadmap = () => {
    Alert.alert(
      "この目標を削除",
      "この目標は履歴に保存され、一覧からは非表示になります。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除して最初に戻る",
          style: "destructive",
          onPress: () => {
            archiveRoadmap({
              roadmapId: activeRoadmap.id,
              reason: "create-screen-delete",
            });
            onResetToIntro();
          },
        },
      ],
    );
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

  const onCompleteMilestone = React.useCallback(
    (milestoneId: string) => {
      const target = milestones.find(
        (milestone) => milestone.id === milestoneId,
      );
      if (!target) {
        Alert.alert(
          "対象が見つかりません",
          "マイルストーンを再読み込みしてください。",
        );
        return;
      }

      if (target.status === "completed") {
        Alert.alert("達成済み", "この中期目標はすでに達成済みです。");
        return;
      }

      if (target.status === "locked") {
        Alert.alert("未解放", "先に現在の中期目標を達成してください。");
        return;
      }

      clearCurrentMilestone();
      Alert.alert("マイルストーン達成", "通常投稿が1回解放されました。");
    },
    [clearCurrentMilestone, milestones],
  );

  React.useEffect(() => {
    registerScrollToTop("create", () => {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    });

    return () => registerScrollToTop("create", null);
  }, [registerScrollToTop]);

  const renderWizardOptions = () => {
    if (currentWizardQuestion.kind !== "choice") {
      return null;
    }

    return (
      <View style={styles.wizardOptionsBlock}>
        <View style={styles.wizardOptionsWrap}>
          {currentWizardQuestion.options.map((option) => {
            const selected = currentWizardQuestion.value === option;
            return (
              <Pressable
                key={option}
                style={[
                  styles.wizardOptionChip,
                  selected && styles.wizardOptionChipSelected,
                ]}
                onPress={() => {
                  currentWizardQuestion.setter(option);
                  if (option !== "その他") {
                    currentWizardQuestion.otherSetter("");
                  }
                }}
              >
                <Text
                  style={[
                    styles.wizardOptionText,
                    selected && styles.wizardOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {currentWizardQuestion.value === "その他" ? (
          <InputField
            value={currentWizardQuestion.otherValue}
            onChangeText={currentWizardQuestion.otherSetter}
            placeholder="内容を入力してください"
            style={styles.wizardInput}
          />
        ) : null}
      </View>
    );
  };

  const onPickDeadlineDate = (
    event: { type?: string },
    selectedDate?: Date,
  ) => {
    if (Platform.OS !== "ios") {
      setShowDeadlinePicker(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setDeadlineDate(selectedDate);
    setDeadlineInput(formatDeadlineDate(selectedDate));
  };

  React.useEffect(() => {
    if (flowStep !== "roadmap") {
      return;
    }
    initialRoadmapScrollDoneRef.current = null;
  }, [activeRoadmap.id, flowStep]);

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
              {currentWizardQuestion.title}
            </Text>
            {currentWizardQuestion.kind === "date" ? (
              <Pressable
                style={styles.wizardDateButton}
                onPress={() => setShowDeadlinePicker(true)}
              >
                <Text
                  style={[
                    styles.wizardDateText,
                    !currentWizardQuestion.value &&
                      styles.wizardDatePlaceholder,
                  ]}
                >
                  {currentWizardQuestion.value || "カレンダーから日付を選択"}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#FF5F00" />
              </Pressable>
            ) : currentWizardQuestion.kind === "choice" ? (
              renderWizardOptions()
            ) : (
              <InputField
                value={currentWizardQuestion.value}
                onChangeText={currentWizardQuestion.setter}
                placeholder={currentWizardQuestion.placeholder}
                style={styles.wizardInput}
                multiline={wizardStep === 4}
              />
            )}
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
            {currentWizardQuestion.kind === "date" && showDeadlinePicker ? (
              <View style={styles.wizardDatePickerWrap}>
                <DateTimePicker
                  value={deadlineDate ?? new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onPickDeadlineDate}
                  accentColor="#FF5F00"
                  themeVariant="light"
                />
                <Pressable
                  style={styles.wizardDateCloseButton}
                  onPress={() => setShowDeadlinePicker(false)}
                >
                  <Text style={styles.wizardDateCloseButtonText}>閉じる</Text>
                </Pressable>
              </View>
            ) : null}
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
              </View>
            </View>
            <View style={styles.topRightActions}>
              <Pressable
                style={styles.overviewButton}
                onPress={onOpenRoadmapOverview}
              >
                <Ionicons name="map-outline" size={14} color="#2F3C45" />
                <Text style={styles.overviewButtonText}>全体を見る</Text>
              </Pressable>
              <Pressable
                style={styles.avatarButton}
                onPress={onAutoAlignShortTermGoals}
              >
                <Ionicons name="grid-outline" size={20} color="#FF5F00" />
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
            onContentSizeChange={() => {
              if (flowStep !== "roadmap") {
                return;
              }
              if (initialRoadmapScrollDoneRef.current === activeRoadmap.id) {
                return;
              }
              initialRoadmapScrollDoneRef.current = activeRoadmap.id;
              requestAnimationFrame(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
              });
            }}
          >
            <View style={styles.goalHeroCard}>
              <Text style={styles.goalHeroLabel}>
                {activeRoadmap.mode === "manual-level"
                  ? "MANUAL GOAL"
                  : "AI GOAL"}
              </Text>
              <View style={styles.goalHeroTitleRow}>
                {activeRoadmap.mode === "manual-level" ? (
                  <InputField
                    value={
                      activeRoadmap.goal === "未設定" ? "" : activeRoadmap.goal
                    }
                    onChangeText={(text) =>
                      updateRoadmapGoal({
                        roadmapId: activeRoadmap.id,
                        goal: text,
                      })
                    }
                    placeholder="例: Webアプリを完成させる"
                    style={[styles.goalHeroInput, styles.goalHeroInputFlex]}
                  />
                ) : (
                  <Text
                    style={[styles.goalHeroTitle, styles.goalHeroTitleFlex]}
                  >
                    {activeRoadmap.goal}
                  </Text>
                )}
                <Pressable
                  style={styles.goalDeleteButton}
                  onPress={onArchiveCurrentRoadmap}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF5F00" />
                </Pressable>
              </View>
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
              ) : null}
              {(() => {
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
                    top =
                      bounds.startTop + bounds.span * (1 - item.step.position);
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
                        : Math.max(14, Math.min(252, curveX - 80));

                  if (item.type === "milestone") {
                    const milestone = item.milestone;
                    const milestoneStageNumber =
                      activeRoadmap.milestoneTemplates.length -
                      milestoneCounter;
                    const isCurrent = milestone.status === "current";
                    const isCompleted = milestone.status === "completed";
                    const milestoneIndex =
                      activeRoadmap.milestoneTemplates.findIndex(
                        (template) => template.id === milestone.id,
                      );
                    const canEditMilestone = milestoneIndex >= 0;

                    const milestoneResponder = PanResponder.create({
                      onStartShouldSetPanResponder: () => false,
                      onMoveShouldSetPanResponder: (_, gestureState) =>
                        milestoneDragArmedIdRef.current === milestone.id &&
                        Math.abs(gestureState.dy) > 4,
                      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
                        milestoneDragArmedIdRef.current === milestone.id &&
                        Math.abs(gestureState.dy) > 4,
                      onPanResponderGrant: () => {
                        if (milestoneDragArmedIdRef.current === milestone.id) {
                          milestoneIsPanningRef.current = true;
                          setDraggingMilestoneId(milestone.id);
                          milestoneDragTranslateY.setValue(0);
                        }
                      },
                      onPanResponderMove: (_, gestureState) => {
                        if (milestoneDragArmedIdRef.current === milestone.id) {
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
                                milestoneDragArmedIdRef.current === milestone.id
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
                                  styles.stageCompleteButton,
                                  milestone.status !== "current" &&
                                    styles.stageCompleteButtonDisabled,
                                ]}
                                disabled={milestone.status !== "current"}
                                onPress={() =>
                                  onCompleteMilestone(milestone.id)
                                }
                              >
                                <Ionicons
                                  name={
                                    milestone.status === "completed"
                                      ? "checkmark-circle"
                                      : "checkmark-done"
                                  }
                                  size={14}
                                  color="#FFFFFF"
                                />
                                <Text style={styles.stageCompleteButtonText}>
                                  達成
                                </Text>
                              </Pressable>
                              <Pressable
                                style={[
                                  styles.stageOrderButton,
                                  !canEditMilestone &&
                                    styles.orderButtonDisabled,
                                ]}
                                disabled={!canEditMilestone}
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
                                style={styles.stageOrderButton}
                                onPress={() => onDeleteMilestone(milestone.id)}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={12}
                                  color="#E35300"
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
                              <View style={styles.stageTitleWrap}>
                                <Text
                                  style={[
                                    styles.stageTitle,
                                    isCurrent && styles.currentTitle,
                                  ]}
                                  numberOfLines={2}
                                  adjustsFontSizeToFit
                                >
                                  {milestone.title}
                                </Text>
                              </View>
                              <Text style={styles.stageSubtitle}>
                                {milestone.subtitle}
                              </Text>
                            </>
                          )}
                        </Pressable>
                      </Animated.View>
                    );
                  }

                  if (item.type === "step") {
                    const segmentBounds = getSegmentBounds(
                      item.step.segmentIndex,
                    );
                    const top =
                      segmentBounds.startTop +
                      segmentBounds.span * (1 - item.step.position);
                    const dotMinX = 12;
                    const dotMaxX = Math.max(dotMinX, roadmapWidth - 26);
                    const dotLeft = Math.max(
                      dotMinX,
                      Math.min(dotMaxX, curveX),
                    );
                    const stepAnchorLeft = dotLeft - 9;
                    const screenWidth = Dimensions.get("window").width;
                    const edgePadding = 20;
                    const panelMaxWidth = Math.min(
                      160,
                      Math.floor(screenWidth * 0.5),
                      Math.floor(roadmapWidth - edgePadding * 2),
                    );
                    const placeLabelRight = dotLeft <= roadmapWidth / 2;
                    const preferredLeft = placeLabelRight
                      ? dotLeft + 26
                      : dotLeft - 26 - panelMaxWidth;
                    const boundedLeft = Math.max(
                      edgePadding,
                      Math.min(
                        roadmapWidth - edgePadding - panelMaxWidth,
                        preferredLeft,
                      ),
                    );
                    const panelOffsetLeft = boundedLeft - stepAnchorLeft;

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
                          const upperBounds = getSegmentBounds(0);
                          const lowerBounds = getSegmentBounds(
                            PRE_MILESTONE_SEGMENT,
                          );
                          const nextTop = Math.max(
                            upperBounds.startTop,
                            Math.min(lowerBounds.endTop, top + gestureState.dy),
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
                        const upperBounds = getSegmentBounds(0);
                        const lowerBounds = getSegmentBounds(
                          PRE_MILESTONE_SEGMENT,
                        );
                        const nextTop = Math.max(
                          upperBounds.startTop,
                          Math.min(lowerBounds.endTop, top + gestureState.dy),
                        );
                        moveShortTermGoalFreely(item.step.id, nextTop);

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
                              if (stepDragArmedIdRef.current === item.step.id) {
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
                            {
                              minWidth: 120,
                              maxWidth: panelMaxWidth,
                              left: panelOffsetLeft,
                            },
                            placeLabelRight
                              ? styles.microInfoRight
                              : styles.microInfoLeft,
                          ]}
                        >
                          <View
                            style={[
                              styles.microActionRow,
                              placeLabelRight
                                ? styles.microActionRowRight
                                : styles.microActionRowLeft,
                            ]}
                          >
                            <Pressable
                              style={[
                                styles.stepActionButton,
                                item.step.isCompleted
                                  ? styles.stepCompleteButtonActive
                                  : null,
                              ]}
                              onPress={() =>
                                onToggleStepCompleted(item.step.id)
                              }
                            >
                              <Ionicons
                                name={
                                  item.step.isCompleted
                                    ? "checkmark-circle"
                                    : "ellipse-outline"
                                }
                                size={12}
                                color={
                                  item.step.isCompleted ? "#FFFFFF" : "#FF5F00"
                                }
                              />
                            </Pressable>
                            <Pressable
                              style={styles.stepActionButton}
                              onPress={() =>
                                inlineStepEditId === item.step.id
                                  ? onSaveInlineStep(item.step.id)
                                  : onOpenEditStep(item.step)
                              }
                            >
                              <Ionicons
                                name={
                                  inlineStepEditId === item.step.id
                                    ? "checkmark"
                                    : "pencil"
                                }
                                size={12}
                                color="#FF5F00"
                              />
                            </Pressable>
                            {inlineStepEditId === item.step.id ? (
                              <Pressable
                                style={styles.stepActionButton}
                                onPress={onCancelInlineStep}
                              >
                                <Ionicons
                                  name="close"
                                  size={12}
                                  color="#FF5F00"
                                />
                              </Pressable>
                            ) : null}
                            <Pressable
                              style={styles.stepActionButton}
                              onPress={() => onDeleteStep(item.step.id)}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={12}
                                color="#E35300"
                              />
                            </Pressable>
                          </View>
                          {inlineStepEditId === item.step.id ? (
                            <TextInput
                              value={inlineStepTitle}
                              onChangeText={setInlineStepTitle}
                              placeholder="短期目標名"
                              style={[
                                styles.microLabelInput,
                                styles.microLabelField,
                              ]}
                            />
                          ) : (
                            <Pressable
                              style={[
                                styles.microLabelPressable,
                                styles.microLabelField,
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
                                  item.step.isCompleted
                                    ? styles.microLabelCompleted
                                    : null,
                                  draggingStepId === item.step.id
                                    ? styles.microLabelDragging
                                    : null,
                                ]}
                              >
                                {item.step.title}
                              </Text>
                            </Pressable>
                          )}
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
                  const gapTop = milestoneCount === 0 ? top + 46 : top;
                  return (
                    <View
                      key={`gap-${item.gapIndex}`}
                      style={[styles.stepGap, { top: gapTop, left }]}
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
              })()}
              {(milestoneCount === 0
                ? [PRE_MILESTONE_SEGMENT]
                : [
                    PRE_MILESTONE_SEGMENT,
                    ...Array.from({ length: segmentCount }).map(
                      (_, segmentIndex) => segmentIndex,
                    ),
                  ]
              ).map((segmentIndex) => {
                const bounds = getSegmentBounds(segmentIndex);
                const addTop = bounds.startTop + bounds.span * 0.5;
                const addX = getPathXForTop(addTop);
                const isLowerArea = addTop > roadmapHeight - 240;
                const placeOnLeft = isLowerArea || addX > roadmapWidth * 0.58;
                const baseLeft = Math.max(
                  12,
                  Math.min(
                    roadmapWidth - 34,
                    placeOnLeft ? addX - 54 : addX + 26,
                  ),
                );
                const baseTop = addTop - 14 - (isLowerArea ? 26 : 0);
                const buttonId = `segment-add-${segmentIndex}`;
                const buttonOffset = addButtonOffsets[buttonId] ?? {
                  x: 0,
                  y: 0,
                };
                const segmentAddResponder = PanResponder.create({
                  onStartShouldSetPanResponder: () => false,
                  onMoveShouldSetPanResponder: (_, gestureState) =>
                    addButtonDragArmedIdRef.current === buttonId &&
                    Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 4,
                  onMoveShouldSetPanResponderCapture: (_, gestureState) =>
                    addButtonDragArmedIdRef.current === buttonId &&
                    Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 4,
                  onPanResponderGrant: () => {
                    if (addButtonDragArmedIdRef.current === buttonId) {
                      addButtonIsPanningRef.current = true;
                      setDraggingAddButtonId(buttonId);
                      addButtonDragTranslateX.setValue(0);
                      addButtonDragTranslateY.setValue(0);
                    }
                  },
                  onPanResponderMove: (_, gestureState) => {
                    if (addButtonDragArmedIdRef.current === buttonId) {
                      addButtonDidDragRef.current =
                        addButtonDidDragRef.current ||
                        Math.abs(gestureState.dx) + Math.abs(gestureState.dy) >
                          4;
                      addButtonDragTranslateX.setValue(gestureState.dx);
                      addButtonDragTranslateY.setValue(gestureState.dy);
                    }
                  },
                  onPanResponderRelease: (_, gestureState) => {
                    if (addButtonDragArmedIdRef.current === buttonId) {
                      updateAddButtonOffset(
                        buttonId,
                        buttonOffset.x + gestureState.dx,
                        buttonOffset.y + gestureState.dy,
                        { width: 28, height: 28 },
                        baseLeft,
                        addTop - 14,
                      );
                    }
                    resetAddButtonDrag();
                  },
                  onPanResponderTerminate: () => {
                    resetAddButtonDrag();
                  },
                  onPanResponderTerminationRequest: () => false,
                  onShouldBlockNativeResponder: () => true,
                });

                return (
                  <Animated.View
                    key={`segment-add-${segmentIndex}`}
                    style={[
                      styles.segmentAddButton,
                      {
                        top: baseTop,
                        left: baseLeft,
                        transform:
                          draggingAddButtonId === buttonId
                            ? [
                                { translateX: addButtonDragTranslateX },
                                { translateY: addButtonDragTranslateY },
                                { scale: 1.08 },
                              ]
                            : [
                                { translateX: buttonOffset.x },
                                { translateY: buttonOffset.y },
                              ],
                      },
                      draggingAddButtonId === buttonId
                        ? styles.segmentAddButtonDragging
                        : null,
                    ]}
                    {...segmentAddResponder.panHandlers}
                  >
                    <Pressable
                      style={styles.segmentAddButtonInner}
                      onPress={() => {
                        if (
                          addButtonDragArmedIdRef.current === buttonId ||
                          addButtonDidDragRef.current
                        ) {
                          return;
                        }
                        onOpenAddStep(segmentIndex, 0.5);
                      }}
                      delayLongPress={180}
                      onLongPress={() => {
                        addButtonDragArmedIdRef.current = buttonId;
                        setDraggingAddButtonId(buttonId);
                        addButtonIsPanningRef.current = false;
                        addButtonDidDragRef.current = false;
                        addButtonDragTranslateX.setValue(0);
                        addButtonDragTranslateY.setValue(0);
                      }}
                      onPressOut={() => {
                        requestAnimationFrame(() => {
                          if (addButtonIsPanningRef.current) {
                            return;
                          }
                          if (addButtonDragArmedIdRef.current === buttonId) {
                            addButtonDragArmedIdRef.current = null;
                          }
                        });
                      }}
                    >
                      <Ionicons name="add" size={14} color="#FF5F00" />
                    </Pressable>
                  </Animated.View>
                );
              })}
              {(() => {
                const buttonId = "milestone-add-fab";
                const baseLeft = 20;
                const baseTop = roadmapHeight - 90;
                const buttonOffset = addButtonOffsets[buttonId] ?? {
                  x: 0,
                  y: 0,
                };
                const milestoneAddResponder = PanResponder.create({
                  onStartShouldSetPanResponder: () => false,
                  onMoveShouldSetPanResponder: (_, gestureState) =>
                    addButtonDragArmedIdRef.current === buttonId &&
                    Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 4,
                  onMoveShouldSetPanResponderCapture: (_, gestureState) =>
                    addButtonDragArmedIdRef.current === buttonId &&
                    Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 4,
                  onPanResponderGrant: () => {
                    if (addButtonDragArmedIdRef.current === buttonId) {
                      addButtonIsPanningRef.current = true;
                      setDraggingAddButtonId(buttonId);
                      addButtonDragTranslateX.setValue(0);
                      addButtonDragTranslateY.setValue(0);
                    }
                  },
                  onPanResponderMove: (_, gestureState) => {
                    if (addButtonDragArmedIdRef.current === buttonId) {
                      addButtonDidDragRef.current =
                        addButtonDidDragRef.current ||
                        Math.abs(gestureState.dx) + Math.abs(gestureState.dy) >
                          4;
                      addButtonDragTranslateX.setValue(gestureState.dx);
                      addButtonDragTranslateY.setValue(gestureState.dy);
                    }
                  },
                  onPanResponderRelease: (_, gestureState) => {
                    if (addButtonDragArmedIdRef.current === buttonId) {
                      updateAddButtonOffset(
                        buttonId,
                        buttonOffset.x + gestureState.dx,
                        buttonOffset.y + gestureState.dy,
                        { width: 56, height: 56 },
                        baseLeft,
                        baseTop,
                      );
                    }
                    resetAddButtonDrag();
                  },
                  onPanResponderTerminate: () => {
                    resetAddButtonDrag();
                  },
                  onPanResponderTerminationRequest: () => false,
                  onShouldBlockNativeResponder: () => true,
                });

                return (
                  <Animated.View
                    style={[
                      styles.pathFab,
                      {
                        left: "50%",
                        bottom: 26,
                        marginLeft: -28,
                        transform:
                          draggingAddButtonId === buttonId
                            ? [
                                { translateX: addButtonDragTranslateX },
                                { translateY: addButtonDragTranslateY },
                                { scale: 1.05 },
                              ]
                            : [
                                { translateX: buttonOffset.x },
                                { translateY: buttonOffset.y },
                              ],
                      },
                      draggingAddButtonId === buttonId
                        ? styles.pathFabDragging
                        : null,
                    ]}
                    {...milestoneAddResponder.panHandlers}
                  >
                    <Pressable
                      style={styles.pathFabButton}
                      onPress={() => {
                        if (
                          addButtonDragArmedIdRef.current === buttonId ||
                          addButtonDidDragRef.current
                        ) {
                          return;
                        }
                        onOpenAddMilestone();
                      }}
                      delayLongPress={180}
                      onLongPress={() => {
                        addButtonDragArmedIdRef.current = buttonId;
                        setDraggingAddButtonId(buttonId);
                        addButtonIsPanningRef.current = false;
                        addButtonDidDragRef.current = false;
                        addButtonDragTranslateX.setValue(0);
                        addButtonDragTranslateY.setValue(0);
                      }}
                      onPressOut={() => {
                        requestAnimationFrame(() => {
                          if (addButtonIsPanningRef.current) {
                            return;
                          }
                          if (addButtonDragArmedIdRef.current === buttonId) {
                            addButtonDragArmedIdRef.current = null;
                          }
                        });
                      }}
                    >
                      <Ionicons name="add" size={30} color="#FFFFFF" />
                    </Pressable>
                  </Animated.View>
                );
              })()}
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
                    : `短期目標を追加（区間: ${Math.max(1, segmentCount - (addingStepPlacement?.segmentIndex ?? 0))}, 位置: ${Math.round((addingStepPlacement?.position ?? 0.5) * 100)}%）`}
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
    topRightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    overviewButton: {
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 12,
      backgroundColor: "#EEF3F8",
      borderWidth: 1,
      borderColor: "rgba(72,87,105,0.24)",
    },
    overviewButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#2F3C45",
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
      paddingBottom: 24,
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
    goalHeroTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    goalHeroTitle: {
      color: "#1F2937",
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "700",
    },
    goalHeroTitleFlex: {
      flex: 1,
    },
    goalHeroInput: {
      minHeight: 58,
      fontSize: 20,
    },
    goalHeroInputFlex: {
      flex: 1,
      marginBottom: 0,
    },
    goalDeleteButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.28)",
      backgroundColor: "rgba(255,255,255,0.95)",
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
    wizardOptionsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 2,
    },
    wizardOptionsBlock: {
      gap: 12,
    },
    wizardDateButton: {
      minHeight: 56,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.24)",
      backgroundColor: "rgba(255,255,255,0.96)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    wizardDateText: {
      color: "#2C3E50",
      fontSize: 15,
      fontWeight: "700",
      flex: 1,
    },
    wizardDatePlaceholder: {
      color: "rgba(44,62,80,0.48)",
      fontWeight: "600",
    },
    wizardDatePickerWrap: {
      marginTop: 8,
      padding: 12,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.96)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.16)",
      gap: 10,
    },
    wizardDateCloseButton: {
      alignSelf: "flex-end",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "rgba(255,95,0,0.1)",
    },
    wizardDateCloseButtonText: {
      color: "#FF5F00",
      fontSize: 13,
      fontWeight: "700",
    },
    wizardOptionChip: {
      minHeight: 42,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.22)",
      backgroundColor: "rgba(255,255,255,0.96)",
      alignItems: "center",
      justifyContent: "center",
    },
    wizardOptionChipSelected: {
      backgroundColor: "#FF5F00",
      borderColor: "#FF5F00",
    },
    wizardOptionText: {
      color: "#2C3E50",
      fontSize: 13,
      fontWeight: "700",
    },
    wizardOptionTextSelected: {
      color: "#FFFFFF",
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
      flexDirection: "column",
      top: -4,
      rowGap: 3,
      minWidth: 120,
      maxWidth: 160,
      backgroundColor: "rgba(255,255,255,0.9)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: "flex-start",
      alignItems: "flex-start",
      flexShrink: 1,
      zIndex: 8,
      overflow: "visible",
    },
    microInfoRight: {
      alignItems: "flex-start",
    },
    microInfoLeft: {
      alignItems: "flex-end",
    },
    microActionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      flexWrap: "nowrap",
      flexShrink: 0,
    },
    microActionRowRight: {
      justifyContent: "flex-start",
    },
    microActionRowLeft: {
      justifyContent: "flex-start",
    },
    microLabelPressable: {
      width: "100%",
      alignSelf: "flex-start",
      maxWidth: "100%",
      flexShrink: 1,
    },
    microLabelField: {
      width: "100%",
      alignSelf: "flex-start",
      maxWidth: "100%",
      flexShrink: 1,
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
      alignSelf: "flex-start",
      maxWidth: "100%",
      flexShrink: 1,
      flexWrap: "wrap",
      lineHeight: 16,
      minHeight: 0,
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
    microLabelCompleted: {
      color: "rgba(107,114,128,0.92)",
      backgroundColor: "rgba(244,245,247,0.96)",
      borderColor: "rgba(156,163,175,0.36)",
      textDecorationLine: "line-through",
    },
    microLabelInput: {
      color: "#1F2937",
      fontSize: 11,
      fontWeight: "500",
      backgroundColor: "rgba(255,255,255,0.98)",
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1.5,
      borderColor: "rgba(255,95,0,0.48)",
      alignSelf: "flex-start",
      maxWidth: "100%",
      flexShrink: 1,
      flexWrap: "wrap",
      lineHeight: 16,
      minHeight: 0,
    },
    stepActionButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.28)",
    },
    stepCompleteButtonActive: {
      backgroundColor: "#FF5F00",
      borderColor: "#FF5F00",
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
    segmentAddButtonDragging: {
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 10,
      zIndex: 11,
    },
    segmentAddButtonInner: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
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
    stageCompleteButton: {
      minWidth: 72,
      height: 30,
      borderRadius: 15,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: "#FF5F00",
      borderWidth: 1,
      borderColor: "#FF5F00",
    },
    stageCompleteButtonDisabled: {
      opacity: 0.45,
    },
    stageCompleteButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.5,
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
    stageTitleWrap: {
      flexShrink: 1,
      width: "100%",
    },
    stageTitle: {
      color: "#121212",
      fontSize: 36,
      lineHeight: 42,
      fontWeight: "700",
      marginBottom: 6,
      flexShrink: 1,
      flexWrap: "wrap",
    },
    stageSubtitle: {
      color: "rgba(35,35,35,0.84)",
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400",
      marginBottom: 12,
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
    pathFabDragging: {
      shadowOpacity: 0.48,
      shadowRadius: 22,
      elevation: 12,
      zIndex: 12,
    },
    pathFabButton: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
  });
