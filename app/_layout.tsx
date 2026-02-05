// app/_layout.tsx - PRODUCTION READY: Proper admin + user auth handling
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

// Navigation guard component - PRODUCTION READY
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useAuth();
  const { admin, loading: adminLoading, isLoggingOut } = useAdminAuth();
  const segments = useSegments();
  const router = useRouter();

  const loading = userLoading || adminLoading;

  useEffect(() => {
    if (loading) {
      console.log('[NAV_GUARD]  Still loading auth state...');
      return;
    }

    // Hide splash screen once auth is loaded
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAdminGroup = segments[0] === '(admin)';
    const isIndex = segments.length <= 1 && !inAuthGroup && !inTabsGroup && !inAdminGroup;

    console.log('[NAV_GUARD]  Navigation Check:', { 
      hasUser: !!user,
      hasAdmin: !!admin,
      isLoggingOut,
      userName: user?.fullName || 'none',
      adminName: admin?.fullName || 'none',
      currentSegment: segments[0] || 'index',
      isIndex,
      inAuthGroup,
      inTabsGroup,
      inAdminGroup,
    });

    //  PRIORITY 1: Admin is logged in
    if (admin && !isLoggingOut) {
      if (!inAdminGroup) {
        console.log('[NAV_GUARD]  Admin logged in -> Redirecting to admin panel');
        router.replace('/(admin)/payments');
      } else {
        console.log('[NAV_GUARD]  Admin access granted');
      }
      return;
    }

    //  PRIORITY 2: Admin is logging out
    if (isLoggingOut) {
      console.log('[NAV_GUARD] 🚪 Admin logging out -> Redirecting to login');
      router.replace('/(auth)/login');
      return;
    }

    //  PRIORITY 3: Regular user is logged in
    if (user) {
      // User trying to access auth or index
      if (inAuthGroup || isIndex) {
        console.log('[NAV_GUARD]  User logged in -> Redirecting to dashboard');
        router.replace('/(tabs)');
      }
      // User trying to access admin routes
      else if (inAdminGroup) {
        console.log('[NAV_GUARD]  User cannot access admin routes -> Redirecting to dashboard');
        router.replace('/(tabs)');
      } else {
        console.log('[NAV_GUARD]  User access granted');
      }
      return;
    }

    //  PRIORITY 4: Nobody is logged in
    if (!inAuthGroup) {
      console.log('[NAV_GUARD]  No authentication -> Redirecting to login');
      router.replace('/(auth)/login');
    } else {
      console.log('[NAV_GUARD]  On login screen');
    }
  }, [user, admin, loading, isLoggingOut, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AdminAuthProvider>
            <NavigationGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="screens" />
              </Stack>
            </NavigationGuard>
          </AdminAuthProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}