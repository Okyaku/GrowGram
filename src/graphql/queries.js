/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getPost = /* GraphQL */ `
  query GetPost($id: ID!) {
    getPost(id: $id) {
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
export const listPosts = /* GraphQL */ `
  query ListPosts(
    $filter: ModelPostFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPosts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getStory = /* GraphQL */ `
  query GetStory($id: ID!) {
    getStory(id: $id) {
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
export const listStories = /* GraphQL */ `
  query ListStories(
    $filter: ModelStoryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStories(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        imageKey
        caption
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getStoryReaction = /* GraphQL */ `
  query GetStoryReaction($id: ID!) {
    getStoryReaction(id: $id) {
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
export const listStoryReactions = /* GraphQL */ `
  query ListStoryReactions(
    $filter: ModelStoryReactionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStoryReactions(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        storyId
        reactionType
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getPostLike = /* GraphQL */ `
  query GetPostLike($id: ID!) {
    getPostLike(id: $id) {
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
export const listPostLikes = /* GraphQL */ `
  query ListPostLikes(
    $filter: ModelPostLikeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPostLikes(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        postId
        reactionType
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getPostSave = /* GraphQL */ `
  query GetPostSave($id: ID!) {
    getPostSave(id: $id) {
      id
      postId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const listPostSaves = /* GraphQL */ `
  query ListPostSaves(
    $filter: ModelPostSaveFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPostSaves(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        postId
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getGoal = /* GraphQL */ `
  query GetGoal($id: ID!) {
    getGoal(id: $id) {
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
export const listGoals = /* GraphQL */ `
  query ListGoals(
    $filter: ModelGoalFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGoals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        deadline
        isCompleted
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getProfile = /* GraphQL */ `
  query GetProfile($id: ID!) {
    getProfile(id: $id) {
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
export const listProfiles = /* GraphQL */ `
  query ListProfiles(
    $filter: ModelProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        username
        bio
        iconImageKey
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
