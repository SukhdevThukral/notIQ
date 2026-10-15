import { SafeAreaProvider } from "react-native-safe-area-context";
import RecordingScreen from "./app/(tabs)/record";

export default function App(){
  return(
    <SafeAreaProvider>
      <RecordingScreen/>
    </SafeAreaProvider>
  );
}