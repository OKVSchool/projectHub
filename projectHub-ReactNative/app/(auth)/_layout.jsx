import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a1a' },
        headerTintColor: '#7c6cfa',
        headerTitleStyle: { fontWeight: '700' }
      }}
    />
  )
}
