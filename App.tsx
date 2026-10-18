import { SafeAreaProvider } from "react-native-safe-area-context";
import RecordingScreen from "./app/(tabs)/record";
import {useFonts} from 'expo-font';

import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans'

export default function App(){

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })

  if(!fontsLoaded){
    return null;
  }
  return(
    <SafeAreaProvider>
      <RecordingScreen/>
    </SafeAreaProvider>
  );
}