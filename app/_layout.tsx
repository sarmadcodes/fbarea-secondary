import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <Stack 
            screenOptions={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }}
            initialRouteName="splash"
          >
            <Stack.Screen name="splash" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}