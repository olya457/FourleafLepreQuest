import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import LoaderScreen from '../screens/LoaderScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import MainQuestScreen from '../screens/MainQuestScreen';
import TrophyShelfScreen from '../screens/TrophyShelfScreen';
import LepreTalesScreen from '../screens/LepreTalesScreen';
import SavedTalesScreen from '../screens/SavedTalesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loader" component={LoaderScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MainQuest" component={MainQuestScreen} />
        <Stack.Screen name="TrophyShelf" component={TrophyShelfScreen} />
        <Stack.Screen name="LepreTales" component={LepreTalesScreen} />
        <Stack.Screen name="SavedTales" component={SavedTalesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
