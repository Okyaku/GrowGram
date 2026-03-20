# GrowGram (React Native / Expo Router)

大学生の目標達成と積み上げを可視化・共有するSNSアプリのフロントエンド実装です。  
本プロジェクトは **ライトテーマ（白 + オレンジ）** で統一されています。

## 技術スタック
- React Native (Expo SDK 55)
- Expo Router
- TypeScript
- StyleSheet
- AWS連携用サービス層（Cognito / API Gateway / S3想定）

## 画面構成
### Auth
- `/(auth)/splash`
- `/(auth)/onboarding`
- `/(auth)/login`
- `/(auth)/signup`
- `/(auth)/forgot-password`

### Main Tabs
- `/(tabs)/home`
- `/(tabs)/analysis`
- `/(tabs)/create`（中央大ボタン）
- `/(tabs)/growth`
- `/(tabs)/mypage`

### Sub
- `/profile/[userId]` (ProfileDetail)
- `/story/[storyId]` (StoryView)
- `/notifications`
- `/profile-edit`
- `/legal`

## デザインシステム
共通テーマは `src/theme/theme.ts` に定義しています。
- Primary: `#F97316`
- Background: `#FFFFFF`, `#F3F4F6`
- Text: `#1F2937`, `#6B7280`
- Status: `#10B981`, `#EF4444`

## 共通UI
- `src/components/common/CustomButton.tsx`
- `src/components/common/InputField.tsx`
- `src/components/common/ScreenContainer.tsx`

## AWS連携
- 環境変数サンプル: `.env.example`
- 設計ドキュメント: `src/services/aws/README.md`
- 実装:
  - `src/services/aws/api.ts`
  - `src/services/aws/cognito.ts`
  - `src/services/aws/storage.ts`

## 起動方法
```bash
npm install
npm run ios
# または
npm run android
npm run web
```

## 型チェック
```bash
npx tsc --noEmit
```
