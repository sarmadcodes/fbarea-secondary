// app/(admin)/_layout.jsx - Admin Route Group Layout
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        // Add common admin styling if needed
        contentStyle: {
          backgroundColor: '#ffffff',
        },
      }}
    >
      {/* Admin Login (optional - using modal from main login instead) */}
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      
      {/* Admin Payments List */}
      <Stack.Screen 
        name="payments" 
        options={{ 
          headerShown: false,
          // This is the main admin screen
        }} 
      />
      
      {/* Payment Detail View */}
      <Stack.Screen 
        name="payment-detail" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}