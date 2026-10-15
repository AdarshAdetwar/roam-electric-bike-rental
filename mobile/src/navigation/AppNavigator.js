import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import CatalogScreen from '../screens/CatalogScreen';
import ActiveRentalScreen from '../screens/ActiveRentalScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { height: 64, paddingTop: 8, paddingBottom: 8, borderTopColor: colors.border, backgroundColor: colors.surface },
      tabBarLabelStyle: { fontWeight: '600', fontSize: 12 }
    }}>
      <Tabs.Screen name="Motorbikes" component={CatalogScreen} options={{ title: 'Explore', tabBarLabel: 'Explore', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'compass' : 'compass-outline'} size={21} color={color} /> }} />
      <Tabs.Screen name="Ride" component={ActiveRentalScreen} options={{ title: 'Your ride', tabBarLabel: 'Your ride', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'time' : 'time-outline'} size={21} color={color} /> }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', tabBarLabel: 'Profile', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={22} color={color} /> }} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  const { token } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {token ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
