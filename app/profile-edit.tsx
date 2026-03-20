import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton, InputField, ScreenContainer } from '../src/components/common';
import { theme } from '../src/theme';

export default function ProfileEditScreen() {
  const [avatar, setAvatar] = React.useState<string | null>(null);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('権限が必要です', 'プロフィール画像を選択するには権限が必要です。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn}><Ionicons name='arrow-back' size={20} color={theme.colors.text} /></Pressable>
        <Text style={styles.title}>プロフィール設定</Text>
        <View style={styles.backBtnDummy} />
      </View>

      <View style={styles.avatarWrap}>
        <Pressable style={styles.avatarButton} onPress={pickAvatar}>
          {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder} />}
        </Pressable>
        <Pressable style={styles.editBadge}><Ionicons name='create' size={14} color={theme.colors.white} /></Pressable>
        <Text style={styles.helper}>写真をアップロード</Text>
        <Text style={styles.helperSub}>自分を表現する写真を選びましょう</Text>
      </View>

      <InputField label='氏名またはニックネーム' placeholder='例: 田中 太郎' />
      <InputField label='年齢' placeholder='選択してください' keyboardType='number-pad' />
      <InputField label='現在挑戦していること' placeholder='例: 毎朝5時起き、毎日1時間の読書など' />
      <InputField label='長期的な目標' placeholder='例: 1年後にフルマラソン完走、資格取得' />

      <CustomButton label='プロフィールを保存して次へ' onPress={() => Alert.alert('保存しました', 'プロフィール情報を更新しました。')} />

      <View style={styles.progressRow}>
        <View style={styles.progressOff} />
        <View style={styles.progressOff} />
        <View style={styles.progressOn} />
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>GrowGram Tip:</Text>
        <Text style={styles.tipText}>設定した目標はいつでも変更可能です。一歩ずつ、あなたの「積み上げ」を可視化していきましょう。</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  backBtnDummy: {
    width: 36,
    height: 36,
  },
  title: {
    ...theme.text.title,
    marginBottom: 0,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  avatarButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.soft,
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    flex: 1,
  },
  editBadge: {
    position: 'absolute',
    right: 108,
    top: 102,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  helper: {
    marginTop: 10,
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 34,
  },
  helperSub: {
    color: theme.colors.textSub,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: theme.spacing.sm,
  },
  progressRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  progressOff: {
    width: 90,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  progressOn: {
    width: 90,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  tipCard: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  tipTitle: {
    color: theme.colors.primary,
    fontWeight: '900',
    marginBottom: 4,
  },
  tipText: {
    color: theme.colors.text,
    lineHeight: 22,
  },
});
