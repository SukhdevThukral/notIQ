import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans";
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
    });

    useEffect(() =>  {
        if (loaded || error){
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) return null;

    return <Stack screenOptions={{headerShown: false}}/>;
}