import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled } from "@aws-amplify/datastore";



type EagerAIRoadmapTask = {
  readonly title: string;
  readonly description: string;
}

type LazyAIRoadmapTask = {
  readonly title: string;
  readonly description: string;
}

export declare type AIRoadmapTask = LazyLoading extends LazyLoadingDisabled ? EagerAIRoadmapTask : LazyAIRoadmapTask

export declare const AIRoadmapTask: (new (init: ModelInit<AIRoadmapTask>) => AIRoadmapTask)

type EagerAIRoadmapMilestone = {
  readonly title: string;
  readonly description: string;
  readonly tasks: AIRoadmapTask[];
}

type LazyAIRoadmapMilestone = {
  readonly title: string;
  readonly description: string;
  readonly tasks: AIRoadmapTask[];
}

export declare type AIRoadmapMilestone = LazyLoading extends LazyLoadingDisabled ? EagerAIRoadmapMilestone : LazyAIRoadmapMilestone

export declare const AIRoadmapMilestone: (new (init: ModelInit<AIRoadmapMilestone>) => AIRoadmapMilestone)

type EagerAIRoadmapResult = {
  readonly goal: string;
  readonly milestones: AIRoadmapMilestone[];
}

type LazyAIRoadmapResult = {
  readonly goal: string;
  readonly milestones: AIRoadmapMilestone[];
}

export declare type AIRoadmapResult = LazyLoading extends LazyLoadingDisabled ? EagerAIRoadmapResult : LazyAIRoadmapResult

export declare const AIRoadmapResult: (new (init: ModelInit<AIRoadmapResult>) => AIRoadmapResult)

type EagerPost = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Post, 'id'>;
  };
  readonly id: string;
  readonly content: string;
  readonly title?: string | null;
  readonly tags?: (string | null)[] | null;
  readonly imageKey?: string | null;
  readonly imageKeys?: (string | null)[] | null;
  readonly isArchived?: boolean | null;
  readonly passion?: number | null;
  readonly logic?: number | null;
  readonly routine?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyPost = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Post, 'id'>;
  };
  readonly id: string;
  readonly content: string;
  readonly title?: string | null;
  readonly tags?: (string | null)[] | null;
  readonly imageKey?: string | null;
  readonly imageKeys?: (string | null)[] | null;
  readonly isArchived?: boolean | null;
  readonly passion?: number | null;
  readonly logic?: number | null;
  readonly routine?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Post = LazyLoading extends LazyLoadingDisabled ? EagerPost : LazyPost

export declare const Post: (new (init: ModelInit<Post>) => Post) & {
  copyOf(source: Post, mutator: (draft: MutableModel<Post>) => MutableModel<Post> | void): Post;
}

type EagerStory = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Story, 'id'>;
  };
  readonly id: string;
  readonly imageKey: string;
  readonly caption?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyStory = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Story, 'id'>;
  };
  readonly id: string;
  readonly imageKey: string;
  readonly caption?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Story = LazyLoading extends LazyLoadingDisabled ? EagerStory : LazyStory

export declare const Story: (new (init: ModelInit<Story>) => Story) & {
  copyOf(source: Story, mutator: (draft: MutableModel<Story>) => MutableModel<Story> | void): Story;
}

type EagerStoryReaction = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<StoryReaction, 'id'>;
  };
  readonly id: string;
  readonly storyId: string;
  readonly reactionType?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyStoryReaction = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<StoryReaction, 'id'>;
  };
  readonly id: string;
  readonly storyId: string;
  readonly reactionType?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type StoryReaction = LazyLoading extends LazyLoadingDisabled ? EagerStoryReaction : LazyStoryReaction

export declare const StoryReaction: (new (init: ModelInit<StoryReaction>) => StoryReaction) & {
  copyOf(source: StoryReaction, mutator: (draft: MutableModel<StoryReaction>) => MutableModel<StoryReaction> | void): StoryReaction;
}

type EagerPostLike = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<PostLike, 'id'>;
  };
  readonly id: string;
  readonly postId: string;
  readonly reactionType?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyPostLike = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<PostLike, 'id'>;
  };
  readonly id: string;
  readonly postId: string;
  readonly reactionType?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type PostLike = LazyLoading extends LazyLoadingDisabled ? EagerPostLike : LazyPostLike

export declare const PostLike: (new (init: ModelInit<PostLike>) => PostLike) & {
  copyOf(source: PostLike, mutator: (draft: MutableModel<PostLike>) => MutableModel<PostLike> | void): PostLike;
}

type EagerPostSave = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<PostSave, 'id'>;
  };
  readonly id: string;
  readonly postId: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyPostSave = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<PostSave, 'id'>;
  };
  readonly id: string;
  readonly postId: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type PostSave = LazyLoading extends LazyLoadingDisabled ? EagerPostSave : LazyPostSave

export declare const PostSave: (new (init: ModelInit<PostSave>) => PostSave) & {
  copyOf(source: PostSave, mutator: (draft: MutableModel<PostSave>) => MutableModel<PostSave> | void): PostSave;
}

type EagerFollow = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Follow, 'id'>;
  };
  readonly id: string;
  readonly followerId: string;
  readonly followingId: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyFollow = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Follow, 'id'>;
  };
  readonly id: string;
  readonly followerId: string;
  readonly followingId: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Follow = LazyLoading extends LazyLoadingDisabled ? EagerFollow : LazyFollow

export declare const Follow: (new (init: ModelInit<Follow>) => Follow) & {
  copyOf(source: Follow, mutator: (draft: MutableModel<Follow>) => MutableModel<Follow> | void): Follow;
}

type EagerDirectMessage = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<DirectMessage, 'id'>;
  };
  readonly id: string;
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly body: string;
  readonly storyId?: string | null;
  readonly storyCaption?: string | null;
  readonly readAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyDirectMessage = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<DirectMessage, 'id'>;
  };
  readonly id: string;
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly body: string;
  readonly storyId?: string | null;
  readonly storyCaption?: string | null;
  readonly readAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type DirectMessage = LazyLoading extends LazyLoadingDisabled ? EagerDirectMessage : LazyDirectMessage

export declare const DirectMessage: (new (init: ModelInit<DirectMessage>) => DirectMessage) & {
  copyOf(source: DirectMessage, mutator: (draft: MutableModel<DirectMessage>) => MutableModel<DirectMessage> | void): DirectMessage;
}

type EagerReadReceipt = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ReadReceipt, 'id'>;
  };
  readonly id: string;
  readonly messageId: string;
  readonly readerId: string;
  readonly readAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyReadReceipt = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ReadReceipt, 'id'>;
  };
  readonly id: string;
  readonly messageId: string;
  readonly readerId: string;
  readonly readAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type ReadReceipt = LazyLoading extends LazyLoadingDisabled ? EagerReadReceipt : LazyReadReceipt

export declare const ReadReceipt: (new (init: ModelInit<ReadReceipt>) => ReadReceipt) & {
  copyOf(source: ReadReceipt, mutator: (draft: MutableModel<ReadReceipt>) => MutableModel<ReadReceipt> | void): ReadReceipt;
}

type EagerPostComment = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<PostComment, 'id'>;
  };
  readonly id: string;
  readonly postId: string;
  readonly content: string;
  readonly mentionHandles?: (string | null)[] | null;
  readonly mentionUserIds?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyPostComment = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<PostComment, 'id'>;
  };
  readonly id: string;
  readonly postId: string;
  readonly content: string;
  readonly mentionHandles?: (string | null)[] | null;
  readonly mentionUserIds?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type PostComment = LazyLoading extends LazyLoadingDisabled ? EagerPostComment : LazyPostComment

export declare const PostComment: (new (init: ModelInit<PostComment>) => PostComment) & {
  copyOf(source: PostComment, mutator: (draft: MutableModel<PostComment>) => MutableModel<PostComment> | void): PostComment;
}

type EagerCommentLike = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<CommentLike, 'id'>;
  };
  readonly id: string;
  readonly commentId: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyCommentLike = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<CommentLike, 'id'>;
  };
  readonly id: string;
  readonly commentId: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type CommentLike = LazyLoading extends LazyLoadingDisabled ? EagerCommentLike : LazyCommentLike

export declare const CommentLike: (new (init: ModelInit<CommentLike>) => CommentLike) & {
  copyOf(source: CommentLike, mutator: (draft: MutableModel<CommentLike>) => MutableModel<CommentLike> | void): CommentLike;
}

type EagerGoal = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Goal, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly deadline?: string | null;
  readonly isCompleted: boolean;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyGoal = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Goal, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly deadline?: string | null;
  readonly isCompleted: boolean;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Goal = LazyLoading extends LazyLoadingDisabled ? EagerGoal : LazyGoal

export declare const Goal: (new (init: ModelInit<Goal>) => Goal) & {
  copyOf(source: Goal, mutator: (draft: MutableModel<Goal>) => MutableModel<Goal> | void): Goal;
}

type EagerProfile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Profile, 'id'>;
  };
  readonly id: string;
  readonly username: string;
  readonly bio?: string | null;
  readonly iconImageKey?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyProfile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Profile, 'id'>;
  };
  readonly id: string;
  readonly username: string;
  readonly bio?: string | null;
  readonly iconImageKey?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Profile = LazyLoading extends LazyLoadingDisabled ? EagerProfile : LazyProfile

export declare const Profile: (new (init: ModelInit<Profile>) => Profile) & {
  copyOf(source: Profile, mutator: (draft: MutableModel<Profile>) => MutableModel<Profile> | void): Profile;
}