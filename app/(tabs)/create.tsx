import React from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
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
};

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
    updateMilestone,
    addMilestone,
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
      | { type: "milestone"; milestone: typeof milestones[number] }
      | { type: "step"; step: ShortTermGoal }
      | { type: "gap"; gapIndex: number }
    > = [];

    let stepIndex = 0;

    renderMilestones.forEach((milestone, milestoneIndex) => {
      items.push({ type: "milestone", milestone });

      if (milestoneIndex < renderMilestones.length - 1) {
        if (stepIndex < shortTermGoals.length) {
          items.push({ type: "step", step: shortTermGoals[stepIndex++] });
        } else {
          items.push({ type: "gap", gapIndex: milestoneIndex });
        }
      }
    });

    while (stepIndex < shortTermGoals.length) {
      items.push({ type: "step", step: shortTermGoals[stepIndex++] });
    }

    return items;
  };

  const [addTarget, setAddTarget] = React.useState<null | "milestone" | "step">(
    null,
  );
  const [addingStepIndex, setAddingStepIndex] = React.useState<number | null>(null);
  const [shortTermGoals, setShortTermGoals] = React.useState<ShortTermGoal[]>([
    { id: "step-1", title: "01: 基礎単語", subtitle: "基礎を固める" },
    { id: "step-2", title: "02: ツール導入", subtitle: "環境を整える" },
    { id: "step-3", title: "03: 応用設計", subtitle: "設計を進める" },
  ]);
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
  const currentMilestone = milestones.find(
    (milestone) => milestone.status === "current",
  );
  const progress = milestones.length > 0
    ? Math.round((activeRoadmap.completedCount / milestones.length) * 100)
    : 0;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

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
    setEditingMilestoneId(milestoneId);
    setEditTitle(title);
    setEditSubtitle(subtitle);
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
    });
    setNewMilestoneTitle("");
    setNewMilestoneSubtitle("");
  };

  const onAddStep = () => {
    if (!newStepTitle.trim() || !newStepSubtitle.trim()) {
      Alert.alert("入力不足", "短期目標名と説明を入力してください。");
      return;
    }
    setShortTermGoals((prev) => {
      const newStep = {
        id: `step-${Date.now()}`,
        title: newStepTitle.trim(),
        subtitle: newStepSubtitle.trim(),
      };
      if (addingStepIndex === null || addingStepIndex >= prev.length) {
        return [...prev, newStep];
      }
      return [
        ...prev.slice(0, addingStepIndex),
        newStep,
        ...prev.slice(addingStepIndex),
      ];
    });
    setNewStepTitle("");
    setNewStepSubtitle("");
    setAddTarget(null);
    setAddingStepIndex(null);
  };

  const onOpenEditStep = (step: ShortTermGoal) => {
    setEditingStepId(step.id);
    setEditStepTitle(step.title);
    setEditStepSubtitle(step.subtitle);
    setAddTarget(null);
    setAddingStepIndex(null);
  };

  const onOpenAddStep = (index: number) => {
    setAddTarget("step");
    setAddingStepIndex(index);
    setNewStepTitle("");
    setNewStepSubtitle("");
    setEditingStepId("");
  };

  const onOpenAddMilestone = () => {
    setAddTarget("milestone");
    setNewMilestoneTitle("");
    setNewMilestoneSubtitle("");
    setEditingMilestoneId("");
  };

  const onCancelAdd = () => {
    setAddTarget(null);
    setAddingStepIndex(null);
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
          ? { ...step, title: editStepTitle.trim(), subtitle: editStepSubtitle.trim() }
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
  const pathItems = buildPathItems();

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
      scrollViewRef={scrollViewRef}
    >
      {flowStep === "loading" ? (
        <View style={styles.loaderScreen}>
          <View style={styles.loaderGlyph} />
          <Text style={styles.loaderTitle}>あたなのデータを解析中...</Text>
          <Text style={styles.loaderSubtitle}>1,000件の成功事例と照合しています。</Text>
        </View>
      ) : showIntroScreen ? (
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>ナタの成長を、確実な物語に。</Text>
          <Text style={styles.introDescription}>
            AIに任せるか、自分で自由に描くかを選択し、未来の航路をつくりましょう。
          </Text>
          <Pressable style={styles.primaryAction} onPress={onChooseAIMode}>
            <Text style={styles.primaryActionText}>AIで目標を設定する</Text>
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={onChooseManualMode}>
            <Text style={styles.secondaryActionText}>自分で白紙のロードマップを作る</Text>
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
            <Text style={styles.wizardLabel}>{wizardQuestions[wizardStep].title}</Text>
            <InputField
              value={wizardQuestions[wizardStep].value}
              onChangeText={wizardQuestions[wizardStep].setter}
              placeholder={wizardQuestions[wizardStep].placeholder}
              style={styles.wizardInput}
              multiline={wizardStep === 4}
            />
            <View style={styles.wizardFooter}>
              <Pressable onPress={onBackWizard} style={styles.wizardButtonOutline}>
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
            <Text style={styles.smallHint}>{`ステップ ${wizardStep + 1} / ${wizardQuestions.length}`}</Text>
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.topHeader}>
            <View>
              <Text style={styles.goalLabel}>到達目標</Text>
              <Text style={styles.goalTitle} numberOfLines={1}>
                {activeRoadmap.goal}
              </Text>
            </View>
            <View style={styles.topRightActions}>
              <Pressable
                style={styles.notificationButton}
                onPress={() => router.push("/notifications")}
              >
                <Ionicons name="notifications-outline" size={22} color="#FF5F00" />
                {notifications.length > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText} numberOfLines={1}>
                      {notifications.length}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              <Text style={styles.goalProgress}>{progress}%</Text>
            </View>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {showCompletion ? (
              <View style={styles.completionOverlay}>
                <Text style={styles.completionTitle}>大目標達成！</Text>
                <Text style={styles.completionText}>
                  全てのマイルストーンをクリアしました。新しい目標を設定しましょう。
                </Text>
                <Pressable style={styles.primaryAction} onPress={onResetToIntro}>
                  <Text style={styles.primaryActionText}>新しい目標を作成する</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.roadmapWrap}>
              <View style={styles.gridOverlay}>
                {Array.from({ length: 10 }).map((_, index) => (
                  <View
                    key={`h-${index}`}
                    style={[styles.gridLineHorizontal, { top: index * 86 }]}
                  />
                ))}
                {Array.from({ length: 6 }).map((_, index) => (
                  <View
                    key={`v-${index}`}
                    style={[styles.gridLineVertical, { left: index * 60 }]}
                  />
                ))}
              </View>

              <Svg
                style={styles.pathLayer as any}
                viewBox="0 0 360 860"
                preserveAspectRatio="none"
              >
                <Path
                  d="M34 50 C82 165, 126 252, 72 340 C20 430, 76 526, 158 516 C240 504, 266 612, 210 682 C156 752, 166 830, 304 824"
                  stroke="#FF5F00"
                  strokeWidth={1}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d="M34 50 C82 165, 126 252, 72 340 C20 430, 76 526, 158 516 C240 504, 266 612, 210 682 C156 752, 166 830, 304 824"
                  stroke="#FF5F00"
                  strokeOpacity={0.2}
                  strokeDasharray="14 12"
                  strokeWidth={4}
                  fill="none"
                  strokeLinecap="round"
                />
              </Svg>

              <Text style={styles.pathHint}>
                マイルストーン間の＋を押して短期目標を追加できます。既存の点はタップで編集。
              </Text>
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
                  return pathItems.map((item, index) => {
                    const top = 120 + index * 180;
                    const left =
                      item.type === "milestone"
                        ? milestoneCounter % 2 === 0
                          ? 34
                          : 200
                        : 140;

                    if (item.type === "milestone") {
                      const milestone = item.milestone;
                      const isCurrent = milestone.status === "current";
                      const isCompleted = milestone.status === "completed";
                      milestoneCounter += 1;

                      return (
                        <View
                          key={milestone.id}
                          style={[styles.nodeGroup, { top, left }]}
                        >
                          {isCurrent ? (
                            <AnimatedView
                              style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}
                            />
                          ) : null}

                          <View style={styles.hexagon}>
                            <Svg width={64} height={64} viewBox="0 0 100 100">
                              <Path
                                d="M50 4 L90 26 L90 74 L50 96 L10 74 L10 26 Z"
                                fill={isCompleted ? "#FF5F00" : "#FFFFFF"}
                                stroke="#FF5F00"
                                strokeWidth={isCurrent ? 2.5 : 1.2}
                                opacity={isCompleted ? 0.98 : 0.28}
                              />
                              {isCompleted ? (
                                <Path
                                  d="M34 52 L46 64 L68 38"
                                  fill="none"
                                  stroke="#FFFFFF"
                                  strokeWidth={6}
                                  strokeLinecap="round"
                                />
                              ) : isCurrent ? (
                                <Path
                                  d="M50 30 L50 70 M30 50 L70 50"
                                  fill="none"
                                  stroke="#FF5F00"
                                  strokeWidth={2.2}
                                  strokeLinecap="round"
                                />
                              ) : (
                                <Path
                                  d="M50 28 A22 22 0 1 0 50 72 A22 22 0 1 0 50 28"
                                  fill="none"
                                  stroke="#FF5F00"
                                  strokeWidth={1.6}
                                  opacity={0.4}
                                />
                              )}
                            </Svg>
                          </View>

                          <View style={styles.nodeCardWrapper}>
                            <Pressable
                              style={styles.editBadge}
                              onPress={() =>
                                onOpenEdit(milestone.id, milestone.title, milestone.subtitle)
                              }
                            >
                              <Ionicons name="pencil" size={14} color="#FF5F00" />
                            </Pressable>
                            <Pressable
                              style={styles.nodeCard}
                              onPress={() =>
                                router.push({ pathname: "/post-create", params: { milestoneId: milestone.id } })
                              }
                            >
                              <Text style={styles.nodeMeta}>{`PHASE ${milestoneCounter}`}</Text>
                              <Text
                                style={[styles.nodeTitle, isCurrent && styles.currentTitle]}
                                numberOfLines={1}
                              >
                                {milestone.title}
                              </Text>
                              <Text style={styles.nodeSub}>{milestone.subtitle}</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    }

                    if (item.type === "step") {
                      return (
                        <View
                          key={item.step.id}
                          style={[styles.microStep, { top, left }]}
                        >
                          <Pressable
                            style={styles.microDotContainer}
                            onPress={() => onOpenEditStep(item.step)}
                          >
                            <View style={styles.microDot} />
                          </Pressable>
                          <Text style={styles.microLabel}>{item.step.title}</Text>
                        </View>
                      );
                    }

                    return (
                      <Pressable
                        key={`gap-${item.gapIndex}`}
                        style={[styles.stepGap, { top, left }]}
                        onPress={() => onOpenAddStep(item.gapIndex)}
                      >
                        <View style={styles.stepGapButton}>
                          <Ionicons name="add" size={18} color="#FF5F00" />
                        </View>
                      </Pressable>
                    );
                  });
                })()
              )}
            </View>

            {(addTarget || editingMilestoneId || editingStepId) ? (
              <View style={styles.compactEditorPanel}>
                <Text style={styles.compactEditorTitle}>
                  {editingMilestoneId
                    ? "マイルストーンを編集"
                    : editingStepId
                    ? "短期目標を編集"
                    : addTarget === "milestone"
                    ? "マイルストーンを追加"
                    : "短期目標を追加"}
                </Text>
                <InputField
                  value={
                    editingMilestoneId
                      ? editTitle
                      : addTarget === "milestone"
                      ? newMilestoneTitle
                      : editingStepId
                      ? editStepTitle
                      : newStepTitle
                  }
                  onChangeText={
                    editingMilestoneId
                      ? setEditTitle
                      : addTarget === "milestone"
                      ? setNewMilestoneTitle
                      : editingStepId
                      ? setEditStepTitle
                      : setNewStepTitle
                  }
                  placeholder={
                    editingMilestoneId
                      ? "マイルストーン名"
                      : "短期目標名"
                  }
                  style={styles.addInput}
                />
                <InputField
                  value={
                    editingMilestoneId
                      ? editSubtitle
                      : addTarget === "milestone"
                      ? newMilestoneSubtitle
                      : editingStepId
                      ? editStepSubtitle
                      : newStepSubtitle
                  }
                  onChangeText={
                    editingMilestoneId
                      ? setEditSubtitle
                      : addTarget === "milestone"
                      ? setNewMilestoneSubtitle
                      : editingStepId
                      ? setEditStepSubtitle
                      : setNewStepSubtitle
                  }
                  placeholder="補足説明"
                  style={styles.addInput}
                  multiline
                />
                <View style={styles.editActions}>
                  <Pressable style={styles.editButtonOutline} onPress={editingMilestoneId ? onCancelEdit : editingStepId ? onCancelEditStep : onCancelAdd}>
                    <Text style={styles.editButtonOutlineText}>キャンセル</Text>
                  </Pressable>
                  <Pressable
                    style={styles.editButton}
                    onPress={
                      editingMilestoneId
                        ? onSaveEdit
                        : editingStepId
                        ? onSaveEditStep
                        : addTarget === "milestone"
                        ? onAddMilestone
                        : onAddStep
                    }
                  >
                    <Text style={styles.editButtonText}>
                      {editingMilestoneId || editingStepId ? "保存" : "追加する"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <View style={styles.fauxFooter}>
              <Pressable onPress={onResetToIntro}>
                <Text style={styles.linkText}>最初に戻る</Text>
              </Pressable>
              <Pressable onPress={onClear}>
                <Text style={styles.linkText}>現在のマイルストーンをクリア</Text>
              </Pressable>
            </View>
          </ScrollView>
        </>
      )}
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    topHeader: {
      paddingVertical: 18,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(224,224,224,0.55)",
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    topRightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,95,0,0.08)",
    },
    notificationBadge: {
      position: "absolute",
      top: 6,
      right: 6,
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
    goalLabel: {
      color: "#2C3E50",
      fontSize: 12,
      letterSpacing: 2,
      fontWeight: "700",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    goalTitle: {
      color: "#2C3E50",
      fontSize: 24,
      lineHeight: 34,
      fontWeight: "700",
      maxWidth: 240,
    },
    goalProgress: {
      color: "#FF5F00",
      fontSize: 14,
      fontWeight: "700",
    },
    progressBarBackground: {
      height: 2,
      backgroundColor: "rgba(224,224,224,0.5)",
      width: "100%",
    },
    progressBarFill: {
      height: 2,
      backgroundColor: "#FF5F00",
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 60,
    },
    roadmapWrap: {
      height: 980,
      position: "relative",
      marginBottom: 40,
      backgroundColor: "#FFFFFF",
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
      top: 120,
      left: 24,
      right: 24,
      padding: 24,
      borderRadius: 28,
      backgroundColor: "rgba(255,255,255,0.97)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.16)",
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 32,
      elevation: 6,
      zIndex: 10,
    },
    completionTitle: {
      color: "#2C3E50",
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 12,
      textAlign: "center",
    },
    completionText: {
      color: "#2C3E50",
      opacity: 0.8,
      fontSize: 14,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: 18,
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
    microStep: {
      position: "absolute",
      flexDirection: "row",
      alignItems: "center",
    },
    microDotContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,95,0,0.08)",
      marginRight: 10,
    },
    microDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#FF5F00",
      shadowColor: "#FF5F00",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 3,
    },
    microLabel: {
      color: "#2C3E50",
      fontSize: 12,
      fontWeight: "300",
    },
    stepGap: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255,95,0,0.08)",
    },
    stepGapButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(255,95,0,0.16)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.22)",
    },
    pathHint: {
      position: "absolute",
      top: 28,
      left: 24,
      right: 24,
      color: "#2C3E50",
      fontSize: 12,
      fontWeight: "300",
      opacity: 0.8,
      lineHeight: 18,
      backgroundColor: "rgba(255,255,255,0.9)",
      padding: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.14)",
    },
    compactEditorPanel: {
      marginTop: 24,
      marginHorizontal: 16,
      padding: 18,
      borderRadius: 22,
      backgroundColor: "rgba(248,249,250,0.96)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.16)",
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
    fauxFooter: {
      gap: 16,
      marginTop: 10,
    },
    stepListPanel: {
      marginTop: 24,
      marginHorizontal: 16,
      padding: 20,
      borderRadius: 22,
      backgroundColor: "rgba(248,249,250,0.94)",
      borderWidth: 1,
      borderColor: "rgba(255,95,0,0.14)",
    },
    stepListTitle: {
      color: "#2C3E50",
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 12,
      opacity: 0.9,
    },
    stepListItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: "rgba(44,62,80,0.08)",
      paddingVertical: 14,
    },
    stepListText: {
      flex: 1,
      paddingRight: 12,
    },
    stepListLabel: {
      color: "#2C3E50",
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 4,
    },
    stepListSubtitle: {
      color: "#2C3E50",
      fontSize: 12,
      fontWeight: "300",
      opacity: 0.8,
    },
    stepEditButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: "rgba(255,95,0,0.12)",
    },
    stepEditButtonText: {
      color: "#FF5F00",
      fontWeight: "700",
      fontSize: 12,
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
