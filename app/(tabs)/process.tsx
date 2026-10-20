import { useEffect, useState } from "react";
import{
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator
} from  "react-native"

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage, { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import * as T from "@/constants";

import { getSubjectColor } from "../utils";
import { Lecture, Tab } from "../types";

import { getLectures, upsertLecture } from "../storage";

export default function ProcessScreen() {
    const [lectures, setLectures] =  useState<Lecture[]>([]);
    const [selected, setSelected ] = useState<Lecture | null>(null);
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState("");
    const [tab, setTab] = useState<Tab>("notes");
    const [flipped, setFlipped] = useState<Record<number, boolean>>({});

    useEffect(()=> {
        load();
    }, [])

    async function load() {
        setLectures(await getLectures());
    }

    async function processLecture(lecture: Lecture){
        if (!lecture.audioUri){
            Alert.alert("No audio", "This lecture has no recording attached");
            return;
        }
        setProcessing(true);
        setTab("notes");
        setFlipped({});

        try{
            setStep("transcribing audio...");
            // const transcript =

            setStep("generating notes & flashcards...")
        } catch{
            
        } finally{
            setProcessing(false);
            setStep("");
        }
    }

    if (!selected){
        return(
            <SafeAreaView style={s.safe}>
                <StatusBar style="dark"/>
                <ScrollView contentContainerStyle={s.scroll}>
                    <Text style={s.pageTitle}>your lectures</Text>
                    {lectures.length === 0 && (
                        <Text style={s.empty}>no recordings yet - go record one!</Text>
                    )}

                    {lectures.map((lect)=> (
                        <TouchableOpacity key={lect.id} style={[s.lectureCard, {
                            backgroundColor: getSubjectColor(lect.subject)
                        }]} onPress={()=> {
                            setSelected(lect); setTab("notes");
                            setFlipped({});
                        }} activeOpacity={0.8}>
                            <View style={s.lectureRow}>
                                <View style={{flex: 1}}>
                                    <Text style={s.lectureSubj}>{lect.subject}</Text>
                                    <Text style={s.lectureMeta}>{lect.date} · {lect.duration}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        )
    }
}


const sB = StyleSheet.create({
    text: {
        fontSize: T.FONT.xs,
        fontFamily:  T.FONTS_FAMILY.bold,
        color: T.COLORS.lightText
    }
})

const s = StyleSheet.create({
    safe:{
        flex: 1,
        backgroundColor: T.COLORS.lightBg
    },

    scroll:{
        paddingHorizontal : T.SPACING.md,
        paddingTop: T.SPACING.md,
        paddingBottom: T.SPACING.xxl,
    },

    pageTitle: {
        fontSize: T.FONT.xxl,
        fontFamily: T.FONTS_FAMILY.extrabold, color: T.COLORS.lightText,
        letterSpacing: -2,
        marginBottom: T.SPACING.lg
    },

    empty:  {
        textAlign: "center",
        color: T.COLORS.lightSubtle, fontFamily: T.FONTS_FAMILY.bold, fontSize: T.FONT.md, marginTop: 60
    },


})
