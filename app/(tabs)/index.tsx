import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as T from '@/constants';

export default function HomeScreen(){
    return(
        <SafeAreaView style={s.safe}>

        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: {
        flex: 1, backgroundColor: T.COLORS.lightBg, justifyContent: 'center', alignItems: 'center'
    }, title: {
        fontSize: 40, fontFamily: T.FONTS_FAMILY.extrabold, color: T.COLORS.lightText
    },
})