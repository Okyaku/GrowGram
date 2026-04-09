/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createPost = /* GraphQL */ `
  mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
      id
      content
      title
      tags
      imageKey
      imageKeys
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
export const updatePost = /* GraphQL */ `
  mutation UpdatePost(
    $input: UpdatePostInput!
    $condition: ModelPostConditionInput
  ) {
    updatePost(input: $input, condition: $condition) {
      id
      content
      title
      tags
      imageKey
      imageKeys
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
export const deletePost = /* GraphQL */ `
  mutation DeletePost(
    $input: DeletePostInput!
    $condition: ModelPostConditionInput
  ) {
    deletePost(input: $input, condition: $condition) {
      id
      content
      title
      tags
      imageKey
      imageKeys
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
export const createStory = /* GraphQL */ `
  mutation CreateStory(
    $input: CreateStoryInput!
    $condition: ModelStoryConditionInput
  ) {
    createStory(input: $input, condition: $condition) {
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
export const updateStory = /* GraphQL */ `
  mutation UpdateStory(
    $input: UpdateStoryInput!
    $condition: ModelStoryConditionInput
  ) {
    updateStory(input: $input, condition: $condition) {
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
export const deleteStory = /* GraphQL */ `
  mutation DeleteStory(
    $input: DeleteStoryInput!
    $condition: ModelStoryConditionInput
  ) {
    deleteStory(input: $input, condition: $condition) {
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
export const createStoryReaction = /* GraphQL */ `
  mutation CreateStoryReaction(
    $input: CreateStoryReactionInput!
    $condition: ModelStoryReactionConditionInput
  ) {
    createStoryReaction(input: $input, condition: $condition) {
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
export const updateStoryReaction = /* GraphQL */ `
  mutation UpdateStoryReaction(
    $input: UpdateStoryReactionInput!
    $condition: ModelStoryReactionConditionInput
  ) {
    updateStoryReaction(input: $input, condition: $condition) {
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
export const deleteStoryReaction = /* GraphQL */ `
  mutation DeleteStoryReaction(
    $input: DeleteStoryReactionInput!
    $condition: ModelStoryReactionConditionInput
  ) {
    deleteStoryReaction(input: $input, condition: $condition) {
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
export const createPostLike = /* GraphQL */ `
  mutation CreatePostLike(
    $input: CreatePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    createPostLike(input: $input, condition: $condition) {
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
export const updatePostLike = /* GraphQL */ `
  mutation UpdatePostLike(
    $input: UpdatePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    updatePostLike(input: $input, condition: $condition) {
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
export const deletePostLike = /* GraphQL */ `
  mutation DeletePostLike(
    $input: DeletePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    deletePostLike(input: $input, condition: $condition) {
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
export const createPostSave = /* GraphQL */ `
  mutation CreatePostSave(
    $input: CreatePostSaveInput!
    $condition: ModelPostSaveConditionInput
  ) {
    createPostSave(input: $input, condition: $condition) {
      id
      postId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const updatePostSave = /* GraphQL */ `
  mutation UpdatePostSave(
    $input: UpdatePostSaveInput!
    $condition: ModelPostSaveConditionInput
  ) {
    updatePostSave(input: $input, condition: $condition) {
      id
      postId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const deletePostSave = /* GraphQL */ `
  mutation DeletePostSave(
    $input: DeletePostSaveInput!
    $condition: ModelPostSaveConditionInput
  ) {
    deletePostSave(input: $input, condition: $condition) {
      id
      postId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const createFollow = /* GraphQL */ `
  mutation CreateFollow(
    $input: CreateFollowInput!
    $condition: ModelFollowConditionInput
  ) {
    createFollow(input: $input, condition: $condition) {
      id
      followerId
      followingId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const updateFollow = /* GraphQL */ `
  mutation UpdateFollow(
    $input: UpdateFollowInput!
    $condition: ModelFollowConditionInput
  ) {
    updateFollow(input: $input, condition: $condition) {
      id
      followerId
      followingId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const deleteFollow = /* GraphQL */ `
  mutation DeleteFollow(
    $input: DeleteFollowInput!
    $condition: ModelFollowConditionInput
  ) {
    deleteFollow(input: $input, condition: $condition) {
      id
      followerId
      followingId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const createDirectMessage = /* GraphQL */ `
  mutation CreateDirectMessage(
    $input: CreateDirectMessageInput!
    $condition: ModelDirectMessageConditionInput
  ) {
    createDirectMessage(input: $input, condition: $condition) {
      id
      fromUserId
      toUserId
      body
      storyId
      storyCaption
      readAt
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const updateDirectMessage = /* GraphQL */ `
  mutation UpdateDirectMessage(
    $input: UpdateDirectMessageInput!
    $condition: ModelDirectMessageConditionInput
  ) {
    updateDirectMessage(input: $input, condition: $condition) {
      id
      fromUserId
      toUserId
      body
      storyId
      storyCaption
      readAt
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const deleteDirectMessage = /* GraphQL */ `
  mutation DeleteDirectMessage(
    $input: DeleteDirectMessageInput!
    $condition: ModelDirectMessageConditionInput
  ) {
    deleteDirectMessage(input: $input, condition: $condition) {
      id
      fromUserId
      toUserId
      body
      storyId
      storyCaption
      readAt
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const createReadReceipt = /* GraphQL */ `
  mutation CreateReadReceipt(
    $input: CreateReadReceiptInput!
    $condition: ModelReadReceiptConditionInput
  ) {
    createReadReceipt(input: $input, condition: $condition) {
      id
      messageId
      readerId
      readAt
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const updateReadReceipt = /* GraphQL */ `
  mutation UpdateReadReceipt(
    $input: UpdateReadReceiptInput!
    $condition: ModelReadReceiptConditionInput
  ) {
    updateReadReceipt(input: $input, condition: $condition) {
      id
      messageId
      readerId
      readAt
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const deleteReadReceipt = /* GraphQL */ `
  mutation DeleteReadReceipt(
    $input: DeleteReadReceiptInput!
    $condition: ModelReadReceiptConditionInput
  ) {
    deleteReadReceipt(input: $input, condition: $condition) {
      id
      messageId
      readerId
      readAt
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const createPostComment = /* GraphQL */ `
  mutation CreatePostComment(
    $input: CreatePostCommentInput!
    $condition: ModelPostCommentConditionInput
  ) {
    createPostComment(input: $input, condition: $condition) {
      id
      postId
      content
      mentionHandles
      mentionUserIds
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const updatePostComment = /* GraphQL */ `
  mutation UpdatePostComment(
    $input: UpdatePostCommentInput!
    $condition: ModelPostCommentConditionInput
  ) {
    updatePostComment(input: $input, condition: $condition) {
      id
      postId
      content
      mentionHandles
      mentionUserIds
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const deletePostComment = /* GraphQL */ `
  mutation DeletePostComment(
    $input: DeletePostCommentInput!
    $condition: ModelPostCommentConditionInput
  ) {
    deletePostComment(input: $input, condition: $condition) {
      id
      postId
      content
      mentionHandles
      mentionUserIds
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const createCommentLike = /* GraphQL */ `
  mutation CreateCommentLike(
    $input: CreateCommentLikeInput!
    $condition: ModelCommentLikeConditionInput
  ) {
    createCommentLike(input: $input, condition: $condition) {
      id
      commentId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const updateCommentLike = /* GraphQL */ `
  mutation UpdateCommentLike(
    $input: UpdateCommentLikeInput!
    $condition: ModelCommentLikeConditionInput
  ) {
    updateCommentLike(input: $input, condition: $condition) {
      id
      commentId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const deleteCommentLike = /* GraphQL */ `
  mutation DeleteCommentLike(
    $input: DeleteCommentLikeInput!
    $condition: ModelCommentLikeConditionInput
  ) {
    deleteCommentLike(input: $input, condition: $condition) {
      id
      commentId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const createGoal = /* GraphQL */ `
  mutation CreateGoal(
    $input: CreateGoalInput!
    $condition: ModelGoalConditionInput
  ) {
    createGoal(input: $input, condition: $condition) {
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
export const updateGoal = /* GraphQL */ `
  mutation UpdateGoal(
    $input: UpdateGoalInput!
    $condition: ModelGoalConditionInput
  ) {
    updateGoal(input: $input, condition: $condition) {
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
export const deleteGoal = /* GraphQL */ `
  mutation DeleteGoal(
    $input: DeleteGoalInput!
    $condition: ModelGoalConditionInput
  ) {
    deleteGoal(input: $input, condition: $condition) {
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
export const createProfile = /* GraphQL */ `
  mutation CreateProfile(
    $input: CreateProfileInput!
    $condition: ModelProfileConditionInput
  ) {
    createProfile(input: $input, condition: $condition) {
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
export const updateProfile = /* GraphQL */ `
  mutation UpdateProfile(
    $input: UpdateProfileInput!
    $condition: ModelProfileConditionInput
  ) {
    updateProfile(input: $input, condition: $condition) {
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
export const deleteProfile = /* GraphQL */ `
  mutation DeleteProfile(
    $input: DeleteProfileInput!
    $condition: ModelProfileConditionInput
  ) {
    deleteProfile(input: $input, condition: $condition) {
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
