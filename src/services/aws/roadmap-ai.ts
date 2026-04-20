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

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const raw = error as {
      errors?: Array<{ message?: string }>;
      message?: string;
    };

    if (Array.isArray(raw.errors) && raw.errors.length > 0) {
      const firstMessage = raw.errors[0]?.message?.trim();
      if (firstMessage) {
        return firstMessage;
      }
    }

    if (typeof raw.message === "string" && raw.message.trim()) {
      return raw.message.trim();
    }
  }

  return "AIロードマップ生成に失敗しました。";
};

export async function generateRoadmapFromAI(
  input: AIRoadmapRequest,
): Promise<AIRoadmapResponse> {
  try {
    const client = generateClient({ authMode: "userPool" });

    const aiCall = client.graphql({
      query: generateRoadmapQuery,
      variables: { input },
    }) as Promise<{
      data?: { generateRoadmapWithAI?: unknown };
      errors?: Array<{ message?: string }>;
    }>;

    const response = await Promise.race([
      aiCall,
      new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error("AI roadmap generation timed out after 90 seconds."),
            ),
          90000,
        );
      }),
    ]);

    if (Array.isArray(response?.errors) && response.errors.length > 0) {
      throw new Error(
        response.errors
          .map((item) => item?.message?.trim())
          .filter((item): item is string => Boolean(item))
          .join(" | "),
      );
    }

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
    const message = getErrorMessage(error);
    console.warn("[Roadmap AI] request failed:", message);
    throw new Error(message);
  }
}
