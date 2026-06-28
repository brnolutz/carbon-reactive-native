import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { C } from '../../src/constants/theme';
import Svg, { Path, Circle, Line, Polyline, Polygon } from 'react-native-svg';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6">
      <Path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H15v-5h-6v5H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />
    </Svg>
  );
}

function TreinoIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6">
      <Circle cx="12" cy="12" r="9" />
      <Line x1="12" y1="8" x2="12" y2="16" />
      <Line x1="8" y1="12" x2="16" y2="12" />
    </Svg>
  );
}

function ProgressoIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <Line x1="5" y1="19" x2="19" y2="5" />
      <Polyline points="9 5 19 5 19 15" />
    </Svg>
  );
}

function CorpoIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6">
      <Circle cx="12" cy="12" r="9" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

function CoachIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l1.2 7.8L21 12l-7.8 1.2L12 21l-1.2-7.8L3 12l7.8-1.2z" />
    </Svg>
  );
}

const TABS = [
  { name: 'index', label: 'Home', Icon: HomeIcon },
  { name: 'treino', label: 'Treino', Icon: TreinoIcon },
  { name: 'progresso', label: 'Progresso', Icon: ProgressoIcon },
  { name: 'corpo', label: 'Corpo', Icon: CorpoIcon },
  { name: 'coach', label: 'Coach', Icon: CoachIcon },
];

function CarbonTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => {
          const isActive = state.index === i;
          const color = isActive ? '#fff' : 'rgba(255,255,255,0.32)';

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {isActive ? (
                <View style={styles.activeTab}>
                  <tab.Icon color={color} />
                  <Text style={styles.activeLabel}>{tab.label}</Text>
                </View>
              ) : (
                <View style={styles.inactiveTab}>
                  <tab.Icon color={color} />
                  <Text style={styles.inactiveLabel}>{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CarbonTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="treino" />
      <Tabs.Screen name="progresso" />
      <Tabs.Screen name="corpo" />
      <Tabs.Screen name="coach" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: '#080A0E',
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  tabBar: {
    backgroundColor: 'rgba(8,10,14,1)',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22,
    paddingVertical: 7,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 3,
  },
  inactiveTab: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 3,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.32)',
  },
});
