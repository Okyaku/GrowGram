import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomButton, InputField, ScreenContainer } from '../src/components/common';
import { theme } from '../src/theme';

export default function StoryCreateScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = React.useState<string | null>(null);

  const onPickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('権限が必要です', '写真を選択するためにメディア権限を許可してください。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>ストーリー投稿</Text>
        <View style={styles.iconDummy} />
      </View>

      <Pressable style={styles.upload} onPress={onPickImage}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.uploaded} /> : <Text style={styles.uploadText}>写真を選択</Text>}
      </Pressable>

      <InputField label='ひとこと' placeholder='今の気持ちや学びを共有...' multiline style={styles.multiline} />
      <CustomButton label='ストーリーを投稿' onPress={() => Alert.alert('投稿完了', 'ストーリーを投稿しました。')} />
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDummy: {
    width: 40,
    height: 40,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  upload: {
    height: 240,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  uploadText: {
    color: theme.colors.textSub,
    fontWeight: '700',
  },
  uploaded: {
    width: '100%',
    height: '100%',
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
});
