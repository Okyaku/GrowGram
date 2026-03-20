export type AuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type SignedUploadResponse = {
  uploadUrl: string;
  fileUrl: string;
  contentType: string;
};

export type ApiError = {
  statusCode: number;
  message: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignUpPayload = {
  nickname: string;
  email: string;
  password: string;
};
