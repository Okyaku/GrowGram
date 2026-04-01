import 'react-native-get-random-values';

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Amplify } from 'aws-amplify';
import awsExports from './src/aws-exports';

Amplify.configure(awsExports);

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 GROW GRAMへようこそ！</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
});
