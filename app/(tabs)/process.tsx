import { useEffect, useState } from "react";
import{
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator
} from  "react-native"

import { useRef,useCallback} from "react";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import {SafeAreaView } from "react-native-safe-area-context";
import {StatusBar } from "expo-status-bar";
import * as T from "@/constants";
import { getSubjectColor } from "../utils";
import { Lecture, Tab } from "../types";
import { transcribeAudio, processingWithAI } from "../api";
import { getLectures, upsertLecture } from "../storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProcessScreen() {
    const [lectures, setLectures] =  useState<Lecture[]>([]);
    const [selected, setSelected ] = useState<Lecture | null>(null);
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState("");
    const [tab, setTab] = useState<Tab>("notes");
    const [flipped, setFlipped] = useState<Record<number, boolean>>({});
    const {autoId} = useLocalSearchParams<{autoId? : string}>();
    const autoTriggered = useRef(false);

    useEffect(()=> {
        load();
    }, [])

    useFocusEffect(
        useCallback(()=>{

            async function autoProcess() {

                const pendingId = await AsyncStorage.getItem('pendingProcessId');
                console.log("focus fired, pendingId:", pendingId);
                if (!pendingId) return;

                await AsyncStorage.removeItem('pendingProcessId');

                const all = await getLectures();
                setLectures(all);

                const target = all.find((l)=> l.id === autoId);
                console.log("focus  - autoId:", autoId, "target:", target?.id);

                if(!target){
                    return;
                }

                autoTriggered.current = true;
                setSelected(target);
                setTab("notes");
                processLecture(target);
            }

            autoProcess();

            return ()=> {
                autoTriggered.current = false;
            };
        }, [autoId])
    )

    async function load() {
        setLectures(await getLectures());
    }

    async function processLecture(lecture: Lecture){
        console.log("processLecture called:", lecture.id);
        console.log("audioUri:", lecture.audioUri);
        console.log("subject:", lecture.subject);

        if (!lecture.audioUri){
            Alert.alert("No audio", "This lecture has no recording attached");
            return;
        }
        setProcessing(true);
        setTab("notes");
        setFlipped({});

        try{
            setStep("transcribing audio...");
            const transcript = await transcribeAudio(lecture.audioUri);

            setStep("generating notes & flashcards...");
            const {notes, flashcards, examHints} = await processingWithAI(transcript, lecture.subject);

            const updated: Lecture = {...lecture, transcript, notes, flashcards, examHints, status: "done"};

            const next = await upsertLecture(updated)

            setLectures(next);
            setSelected(updated);
        } catch(err:any){
            Alert.alert("Error", err.message ?? "Something went wrong.");
            const errored: Lecture = {...lecture, status: "error"};
            const next = await upsertLecture(errored);

            setLectures(next);
            setSelected(errored);
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

    const isDone = selected.status === "done";

    return(
        <SafeAreaView style={s.safe}>
            <StatusBar style="dark"/>
            <ScrollView contentContainerStyle={s.scroll}>

                <TouchableOpacity onPress={()=> {
                    setSelected(null);
                    load();
                }} style={s.back}>
                    <Text style={s.backText}>← all lectures</Text>
                </TouchableOpacity>

                <View style={[s.heroCard, {
                    backgroundColor: getSubjectColor(selected.subject)
                }]}>
                    <Text style={s.heroSubject}>{selected.subject}</Text>
                    <Text style={s.heroMeta}>{selected.date} · {selected.duration}</Text>
                </View>

                {!isDone && !processing && (
                    <TouchableOpacity style={s.processBtn} onPress={()=> {
                        console.log("process button tapped, selected:", selected?.id); processLecture(selected)
                    }} activeOpacity={0.9}>
                        <Text style={s.processBtnText}>process lecture</Text>
                    </TouchableOpacity>
                )}

                {processing && (
                    <View style={s.loadingCard}>
                        <ActivityIndicator size="large" color={T.COLORS.lightText}/>
                        <Text style={s.loadingStep}>{step}</Text>
                        <Text style={s.loadingHint}>this takes a while, dont close the app</Text>
                    </View>
                )}

                {isDone && (
                        <>
                        <View style={s.tabs}>
                            {(["notes", "flashcards", "hints"] as Tab[]).map((t) => (
                                <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]}
                                onPress={() => {
                                    setTab(t)
                                }}>

                                <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>{t}</Text>
                                
                                </TouchableOpacity>
                            ))}
                        </View>

                        {tab === "notes" && (
                            <View style={s.contentCard}>
                                <Text style={s.notesText}>{selected.notes}</Text>
                            </View>
                        )}

                        {tab === "flashcards" && selected.flashcards.map((fcs, i)=> (
                            <TouchableOpacity key={i} style={[s.flashCard, {
                                backgroundColor: flipped[i] ? T.COLORS.pastelPurp : T.COLORS.myWhite
                            }]} onPress={()=>  setFlipped((f)=> ({...f, [i]: !f[i] }))} activeOpacity={0.9}>

                                <Text style={s.flashCardLABEL}>{flipped[i] ? "ANSWER" : "QUESTION"}</Text>

                                <Text style={s.flashCardTEXT}>
                                    {flipped[i] ? fcs.back : fcs.front}
                                </Text>

                                <Text style={s.flashCardHINT}>
                                    tap to flip
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {tab === "hints" && selected.examHints.map((hint, i)=>(
                            <View key={i} style={s.hintCard}>
                                <Text style={s.hintNum}>0{i+1}</Text>
                                <Text style={s.hintText}>{hint}</Text>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    )
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

    processBtn:{
        backgroundColor: T.COLORS.lightText,
        borderRadius: T.RADIUS.full, paddingVertical: 18,
        alignItems: "center",
        marginBottom: T.SPACING.lg,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 6,
        }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 10,
    },

    processBtnText: {
        fontSize: T.FONT.lg, fontFamily: T.FONTS_FAMILY.extrabold,
        color: T.COLORS.lightBg, letterSpacing: -0.5
    },
    

    loadingCard: {
        backgroundColor: T.COLORS.myWhite,
        borderRadius: 24,
        padding: T.SPACING.xl,
        alignItems: "center",
        marginBottom: T.SPACING.lg,
        gap: T.SPACING.sm
    },

    loadingStep: {
        fontSize: T.FONT.md, fontFamily :T.FONTS_FAMILY.bold,
        color: T.COLORS.lightText, marginTop: T.SPACING.sm
    },

    loadingHint: {
        fontSize: T.FONT.sm, fontFamily: T.FONTS_FAMILY.bold, color: T.COLORS.lightSubtle,
        textAlign: "center",
    },

    tabs: {
        flexDirection:"row", gap: 8, marginBottom: T.SPACING.md
    },

    tabBtn: {
        flex: 1,  paddingVertical: 10, borderRadius: T.RADIUS.full,
        backgroundColor: T.COLORS.myWhite, alignItems: "center",
    },

    tabBtnActive: {
        backgroundColor: T.COLORS.lightText,
    },

    tabBtnText: {
        fontSize: T.FONT.sm, 
        fontFamily: T.FONTS_FAMILY.bold,
        color:  T.COLORS.lightMuted,
        letterSpacing: 0.5, 
    },

    tabBtnTextActive: {
        color: T.COLORS.lightBg,
    },

    contentCard: {
        backgroundColor: T.COLORS.myWhite,
        borderRadius: 24,
        padding: T.SPACING.lg,
    },

    notesText: {
        fontSize: T.FONT.sm,
        fontFamily: T.FONTS_FAMILY.bold, 
        color: T.COLORS.lightText,
        lineHeight: 22,
    },

    flashCard: {
        borderRadius: 24,
        padding: T.SPACING.lg, 
        marginBottom: T.SPACING.sm,
        alignItems: "center",
        minHeight: 140, justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 1,
            height: 4,
        }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },

    flashCardLABEL: {
        fontSize: T.FONT.xs,
        fontFamily: T.FONTS_FAMILY.extrabold,
        color: T.COLORS.lightText,
        letterSpacing: 2,
        marginBottom: T.SPACING.sm,
    },

    flashCardTEXT: {
        fontSize: T.FONT.base,
        fontFamily: T.FONTS_FAMILY.bold,
        color: T.COLORS.lightText, textAlign: "center",
        letterSpacing: -0.3,
    },

    flashCardHINT: {
        fontSize: T.FONT.xs,
        color: T.COLORS.lightSubtle, fontFamily: T.FONTS_FAMILY.bold, marginTop: T.SPACING.sm,
    },

    hintCard: {
        backgroundColor: T.COLORS.pastelOrange, borderRadius: 20, 
        padding: T.SPACING.md,
        marginBottom: T.SPACING.sm, flexDirection: "row",
        alignItems: "flex-start",
        gap: T.SPACING.sm,
        shadowColor: "#000",
        shadowOffset: {
            width: 1, height: 3,
        }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3
    },

    hintNum: {
        fontSize: 28, fontFamily: T.FONTS_FAMILY.extrabold, color: T.COLORS.lightText,
        opacity: 0.2, letterSpacing: -1,
    },

    hintText:{
        flex:1,
        fontSize: T.FONT.sm,
        fontFamily: T.FONTS_FAMILY.bold,
        color: T.COLORS.lightText,
        lineHeight: 20,
        marginTop: 6,
    },
})
