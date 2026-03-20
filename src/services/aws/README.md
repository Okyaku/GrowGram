# AWS連携設計 (GrowGram)

## アーキテクチャ
- 認証: Amazon Cognito (User Pool)
- API: API Gateway + Lambda
- DB: DynamoDB または PostgreSQL(RDS)
- 画像: S3 (署名付きURLでアップロード)

## フロント実装方針
1. `authService` は `/auth/*` エンドポイントを通してCognitoと連携。
2. `apiRequest` はBearerトークン付きで共通通信。
3. `storageService` は `/media/signed-url` で取得した署名URLにPUT。

## 想定API
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/refresh`
- `POST /media/signed-url`

## 本番時の追加推奨
- トークンを `expo-secure-store` へ永続化
- Lambda Authorizer でアクセストークン検証
- 画像アップロード後にサムネイル生成 (Lambda + S3イベント)
