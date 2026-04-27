export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  cognito: {
    userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? '',
    clientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? '',
    region: process.env.EXPO_PUBLIC_COGNITO_REGION ?? 'ap-northeast-1',
  },
  s3: {
    bucket: process.env.EXPO_PUBLIC_S3_BUCKET ?? '',
    region: process.env.EXPO_PUBLIC_S3_REGION ?? 'ap-northeast-1',
    cloudFrontDomain: process.env.EXPO_PUBLIC_CLOUDFRONT_DOMAIN ?? '',
  },
};

export const assertEnvReady = () => {
  const required = [
    env.apiBaseUrl,
    env.cognito.userPoolId,
    env.cognito.clientId,
    env.s3.bucket,
  ];

  if (required.some((value) => value.length === 0)) {
    return false;
  }

  return true;
};
