import { Tabs } from "expo-router";
import * as T from '@/constants';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarStyle: {
                backgroundColor: T.COLORS.lightBg, 
                borderTopColor: 'transparent', 
                elevation: 0,
            }, tabBarActiveTintColor: T.COLORS.lightText,  tabBarInactiveTintColor: T.COLORS.lightSubtle, tabBarLabelStyle: {
                fontFamily: T.FONTS_FAMILY.bold,
                fontSize: 11,
            }
        }}>
            <Tabs.Screen name="index" options={{title: 'home'}}/>
            <Tabs.Screen name="record" options={{title: 'record'}}/>
            <Tabs.Screen name="process" options={{title: 'process'}}/>
        </Tabs>
    );
}