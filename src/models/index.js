// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Post, Story, StoryReaction, PostLike, PostSave, Follow, DirectMessage, ReadReceipt, PostComment, CommentLike, Goal, Profile, AIRoadmapTask, AIRoadmapMilestone, AIRoadmapResult } = initSchema(schema);

export {
  Post,
  Story,
  StoryReaction,
  PostLike,
  PostSave,
  Follow,
  DirectMessage,
  ReadReceipt,
  PostComment,
  CommentLike,
  Goal,
  Profile,
  AIRoadmapTask,
  AIRoadmapMilestone,
  AIRoadmapResult
};