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

export async function generateRoadmapFromAI(
  input: AIRoadmapRequest,
): Promise<AIRoadmapResponse> {
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
}
