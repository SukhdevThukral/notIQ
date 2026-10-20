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
                                <StatusBadge status={lect.status}/>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }
}

function StatusBadge({status} : {status: Lecture["status"] }) {
    const map: Record<Lecture["status"], {label: string; bg: string}> = {
        recorded: {
            label: "recorded", bg: T.COLORS.pastelBlue,
        }, processing: {
            label: "processing...", bg: T.COLORS.pastelOrange,
        },  done : {
            label :"done!", bg: T.COLORS.pastelGreen,
        }, error: {
            label: "error", bg: T.COLORS.pastelPink,
        },
    };

    const {
        label, bg  
    } = map[status];

    return (
        <View style={[statusb.badge]}>
            <Text style={statusb.text}>{label}</Text>
        </View>
    );
}

const statusb = StyleSheet.create({
    text: {
        fontSize: T.FONT.xs,
        fontFamily:  T.FONTS_FAMILY.bold,
        color: T.COLORS.lightText
    }, 

    badge: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4
    },
});

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

    lectureCard: {
        borderRadius: 24,
        padding: T.SPACING.md,
        marginBottom: T.SPACING.sm,
        shadowColor: "#000",
        shadowOffset: {
            width: 1,
            height: 4,
        }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
    },

    lectureRow: {
        flexDirection: 'row',
        alignItems: "center",
    }, 

    lectureSubj: {
        fontSize: T.FONT.lg,
        fontFamily: T.FONTS_FAMILY.extrabold,
        color: T.COLORS.lightText, letterSpacing: -0.5
    },

    lectureMeta: {
        fontSize: T.FONT.sm,
        fontFamily: T.FONTS_FAMILY.bold, color: T.COLORS.lightMuted,
        marginTop: 2
    },

    back: {
        marginBottom: T.SPACING.md
    },

    backText: {
        fontSize: T.FONT.sm, fontFamily: T.FONTS_FAMILY.bold, color: T.COLORS.lightMuted
    },

    heroCard: {
        borderRadius: 28, padding: 24,
        marginBottom: T.SPACING.lg,
        shadowColor: "#000",
        shadowOffset: {
            width: 2, height: 6
        }, shadowOpacity: 0.1,
        shadowRadius: 14, elevation: 5
    },

    heroSubject: {
        fontSize: 40, fontFamily: T.FONTS_FAMILY.extrabold, color: T.COLORS.lightText, letterSpacing :-2
    },

    heroMeta : {
        fontSize: T.FONT.sm, fontFamily: T.FONTS_FAMILY.bold, color: T.COLORS.lightMuted, marginTop: 4 
    },
})
