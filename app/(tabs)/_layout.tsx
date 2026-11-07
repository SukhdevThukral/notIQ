import { Tabs } from "expo-router";
import * as T from '@/constants';
import { Image } from "react-native";

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
            <Tabs.Screen name="record" 
                        options={{title: 'home', tabBarIcon: ({color}) => (
                        <Image source={require('../../assets/home.png')} 
                        style={{width:24, height:24, tintColor: color}}/>
            ),}}/>
            <Tabs.Screen name="process" 
                        options={{title: 'process', tabBarIcon: ({color}) => (
                        <Image source={require('../../assets/refresh.png')} 
                        style={{width:24, height:24, tintColor: color}}/>
            ),}}/>
        </Tabs>
    );
}