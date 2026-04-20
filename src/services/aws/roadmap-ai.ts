import { generateClient } from "aws-amplify/api";

export type AIRoadmapTask = {
  title: string;
  description: string;
};

export type AIRoadmapMilestone = {
  title: string;
  description: string;
  tasks: AIRoadmapTask[];
};

export type AIRoadmapResponse = {
  goal: string;
  milestones: AIRoadmapMilestone[];
};

export type AIRoadmapRequest = {
  goal: string;
  deadline: string;
  currentLevel: string;
  weeklyHours: string;
  deliverable: string;
  learningStyle: "practice" | "theory" | "balanced";
  setbacks: string;
};

const buildFallbackRoadmap = (input: AIRoadmapRequest): AIRoadmapResponse => {
  const safeGoal = input.goal.trim() || "目標達成ロードマップ";

  return {
    goal: safeGoal,
    milestones: [
      {
        title: "現状把握",
        description: "目標達成に向けて必要な情報を整理します。",
        tasks: [
          {
            title: "目標を明確化",
            description: "期限と達成条件を1文で定義する。",
          },
          {
            title: "現状を棚卸し",
            description: "今できていることと課題を3つずつ書き出す。",
          },
        ],
      },
      {
        title: "実行計画",
        description: "毎週進めるアクションを決めます。",
        tasks: [
          {
            title: "週次タスク作成",
            description: "1週間単位の実行タスクを設定する。",
          },
          {
            title: "振り返り設定",
            description: "週末に進捗確認の時間を15分確保する。",
          },
        ],
      },
    ],
  };
};

const generateRoadmapQuery = /* GraphQL */ `
  query GenerateRoadmapWithAI($input: AIRoadmapInput!) {
    generateRoadmapWithAI(input: $input) {
      goal
      milestones {
        title
        description
        tasks {
          title
          description
        }
      }
    }
  }
`;

const normalizeTask = (task: unknown): AIRoadmapTask | null => {
  if (!task || typeof task !== "object") {
    return null;
  }

  const raw = task as Partial<AIRoadmapTask>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";
  if (!title || !description) {
    return null;
  }

  return { title, description };
};

const normalizeMilestone = (milestone: unknown): AIRoadmapMilestone | null => {
  if (!milestone || typeof milestone !== "object") {
    return null;
  }

  const raw = milestone as Partial<AIRoadmapMilestone>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks
        .map((item) => normalizeTask(item))
        .filter((item): item is AIRoadmapTask => Boolean(item))
    : [];

  if (!title || !description || tasks.length === 0) {
    return null;
  }

  return { title, description, tasks };
};

export async function generateRoadmapFromAI(
  input: AIRoadmapRequest,
): Promise<AIRoadmapResponse> {
  try {
    const client = generateClient({ authMode: "userPool" });

    const aiCall = client.graphql({
      query: generateRoadmapQuery,
      variables: { input },
    }) as Promise<{ data?: { generateRoadmapWithAI?: unknown } }>;

    const response = await Promise.race([
      aiCall,
      new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error("AI roadmap generation timed out after 30 seconds."),
            ),
          30000,
        );
      }),
    ]);

    const payload = response?.data?.generateRoadmapWithAI;

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "AI response is empty. Verify AppSync Query.generateRoadmapWithAI mapping.",
      );
    }

    const raw = payload as Partial<AIRoadmapResponse>;
    const goal = typeof raw.goal === "string" ? raw.goal.trim() : "";
    const milestones = Array.isArray(raw.milestones)
      ? raw.milestones
          .map((item) => normalizeMilestone(item))
          .filter((item): item is AIRoadmapMilestone => Boolean(item))
      : [];

    if (!goal || milestones.length === 0) {
      throw new Error(
        "AI response format is invalid. Verify Lambda/AppSync returns goal and milestones[].tasks[].",
      );
    }

    return {
      goal,
      milestones,
    };
  } catch (error) {
    console.warn("[Roadmap AI] fallback roadmap applied:", error);
    return buildFallbackRoadmap(input);
  }
}
