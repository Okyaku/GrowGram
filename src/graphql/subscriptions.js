/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreatePost = /* GraphQL */ `
  subscription OnCreatePost(
    $filter: ModelSubscriptionPostFilterInput
    $owner: String
  ) {
    onCreatePost(filter: $filter, owner: $owner) {
      id
      content
      title
      tags
      imageKey
      isArchived
      passion
      logic
      routine
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdatePost = /* GraphQL */ `
  subscription OnUpdatePost(
    $filter: ModelSubscriptionPostFilterInput
    $owner: String
  ) {
    onUpdatePost(filter: $filter, owner: $owner) {
      id
      content
      title
      tags
      imageKey
      isArchived
      passion
      logic
      routine
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeletePost = /* GraphQL */ `
  subscription OnDeletePost(
    $filter: ModelSubscriptionPostFilterInput
    $owner: String
  ) {
    onDeletePost(filter: $filter, owner: $owner) {
      id
      content
      title
      tags
      imageKey
      isArchived
      passion
      logic
      routine
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onCreateStory = /* GraphQL */ `
  subscription OnCreateStory(
    $filter: ModelSubscriptionStoryFilterInput
    $owner: String
  ) {
    onCreateStory(filter: $filter, owner: $owner) {
      id
      imageKey
      caption
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateStory = /* GraphQL */ `
  subscription OnUpdateStory(
    $filter: ModelSubscriptionStoryFilterInput
    $owner: String
  ) {
    onUpdateStory(filter: $filter, owner: $owner) {
      id
      imageKey
      caption
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeleteStory = /* GraphQL */ `
  subscription OnDeleteStory(
    $filter: ModelSubscriptionStoryFilterInput
    $owner: String
  ) {
    onDeleteStory(filter: $filter, owner: $owner) {
      id
      imageKey
      caption
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onCreateStoryReaction = /* GraphQL */ `
  subscription OnCreateStoryReaction(
    $filter: ModelSubscriptionStoryReactionFilterInput
    $owner: String
  ) {
    onCreateStoryReaction(filter: $filter, owner: $owner) {
      id
      storyId
      reactionType
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateStoryReaction = /* GraphQL */ `
  subscription OnUpdateStoryReaction(
    $filter: ModelSubscriptionStoryReactionFilterInput
    $owner: String
  ) {
    onUpdateStoryReaction(filter: $filter, owner: $owner) {
      id
      storyId
      reactionType
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeleteStoryReaction = /* GraphQL */ `
  subscription OnDeleteStoryReaction(
    $filter: ModelSubscriptionStoryReactionFilterInput
    $owner: String
  ) {
    onDeleteStoryReaction(filter: $filter, owner: $owner) {
      id
      storyId
      reactionType
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onCreatePostLike = /* GraphQL */ `
  subscription OnCreatePostLike(
    $filter: ModelSubscriptionPostLikeFilterInput
    $owner: String
  ) {
    onCreatePostLike(filter: $filter, owner: $owner) {
      id
      postId
      reactionType
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdatePostLike = /* GraphQL */ `
  subscription OnUpdatePostLike(
    $filter: ModelSubscriptionPostLikeFilterInput
    $owner: String
  ) {
    onUpdatePostLike(filter: $filter, owner: $owner) {
      id
      postId
      reactionType
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeletePostLike = /* GraphQL */ `
  subscription OnDeletePostLike(
    $filter: ModelSubscriptionPostLikeFilterInput
    $owner: String
  ) {
    onDeletePostLike(filter: $filter, owner: $owner) {
      id
      postId
      reactionType
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onCreatePostSave = /* GraphQL */ `
  subscription OnCreatePostSave(
    $filter: ModelSubscriptionPostSaveFilterInput
    $owner: String
  ) {
    onCreatePostSave(filter: $filter, owner: $owner) {
      id
      postId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdatePostSave = /* GraphQL */ `
  subscription OnUpdatePostSave(
    $filter: ModelSubscriptionPostSaveFilterInput
    $owner: String
  ) {
    onUpdatePostSave(filter: $filter, owner: $owner) {
      id
      postId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeletePostSave = /* GraphQL */ `
  subscription OnDeletePostSave(
    $filter: ModelSubscriptionPostSaveFilterInput
    $owner: String
  ) {
    onDeletePostSave(filter: $filter, owner: $owner) {
      id
      postId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onCreateGoal = /* GraphQL */ `
  subscription OnCreateGoal(
    $filter: ModelSubscriptionGoalFilterInput
    $owner: String
  ) {
    onCreateGoal(filter: $filter, owner: $owner) {
      id
      title
      deadline
      isCompleted
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateGoal = /* GraphQL */ `
  subscription OnUpdateGoal(
    $filter: ModelSubscriptionGoalFilterInput
    $owner: String
  ) {
    onUpdateGoal(filter: $filter, owner: $owner) {
      id
      title
      deadline
      isCompleted
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeleteGoal = /* GraphQL */ `
  subscription OnDeleteGoal(
    $filter: ModelSubscriptionGoalFilterInput
    $owner: String
  ) {
    onDeleteGoal(filter: $filter, owner: $owner) {
      id
      title
      deadline
      isCompleted
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onCreateProfile = /* GraphQL */ `
  subscription OnCreateProfile(
    $filter: ModelSubscriptionProfileFilterInput
    $owner: String
  ) {
    onCreateProfile(filter: $filter, owner: $owner) {
      id
      username
      bio
      iconImageKey
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateProfile = /* GraphQL */ `
  subscription OnUpdateProfile(
    $filter: ModelSubscriptionProfileFilterInput
    $owner: String
  ) {
    onUpdateProfile(filter: $filter, owner: $owner) {
      id
      username
      bio
      iconImageKey
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeleteProfile = /* GraphQL */ `
  subscription OnDeleteProfile(
    $filter: ModelSubscriptionProfileFilterInput
    $owner: String
  ) {
    onDeleteProfile(filter: $filter, owner: $owner) {
      id
      username
      bio
      iconImageKey
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
