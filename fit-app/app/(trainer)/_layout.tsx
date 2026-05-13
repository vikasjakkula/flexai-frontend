import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, Dumbbell, MessageCircle } from 'lucide-react-native';
import { T } from '@/constants/theme';

export default function TrainerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: T.surface,
          borderTopColor: T.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.textDim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: T.fontWeight.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assign"
        options={{
          title: 'Assign Plan',
          tabBarIcon: ({ color }) => <Dumbbell size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
