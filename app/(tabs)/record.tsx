import { useEffect, useState, useRef } from "react";
import * as T from '@/constants';
import {View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Animated, Alert} from 'react-native';

//utils.ts

import {useRouter} from 'expo-router';

import { setPendingId } from "../store";

import { getFormattedDate, getFormattedTime, formatDuration, getSubjectColor } from "../utils";

import { SafeAreaView } from "react-native-safe-area-context";
import {useAudioRecorder, AudioModule, RecordingPresets} from 'expo-audio';
import AsyncStorage from "@react-native-async-storage/async-storage";

import {StatusBar} from 'expo-status-bar';


export default function RecordingScreen(){
    const [subject,setSubject] = useState('');
    const router = useRouter();
    const [date] = useState(getFormattedDate());
    const [time, setTime] = useState(getFormattedTime());
    const [isRecording,setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);

    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const pulsingAnimation = useRef(new Animated.Value(1)).current;

    const subjectColor = getSubjectColor(subject);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(getFormattedTime());
        }, 1000);
        return()=> clearInterval(interval);
    },[])

    useEffect(() => {
        if(isRecording && !isPaused){
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulsingAnimation, {toValue: 1.08, duration: 700, useNativeDriver: true,}),
                    Animated.timing(pulsingAnimation, {toValue: 1, duration: 700, useNativeDriver: true,}),
                ])
            ).start();
        } else {
            pulsingAnimation.setValue(1);
        }
    },[isRecording, isPaused]);

    useEffect(()=> {
        if (isRecording && !isPaused){
            timerRef.current = setInterval(()=> {
                setDuration((d)=> d+1)
            },1000);
        }else {
            if (timerRef.current){
                clearInterval(timerRef.current);
            }
        }
        return()=>{
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    },[isRecording, isPaused]);

    async function requestPermissions(){
        const {status} = await AudioModule.requestRecordingPermissionsAsync();
        if (status !== 'granted'){
            Alert.alert('Permission needed', 'Microphone access is required to record lectures.');
            return false;
        }
        return true;
    }

    async function startRecording(){
        if (!subject.trim()) {
            Alert.alert('HOLLUP', 'What subject is this lecture for?');
            return;
        }

        const granted = await requestPermissions();
        if (!granted){return};


        try{
            await audioRecorder.prepareToRecordAsync()
            audioRecorder.record();
            setIsRecording(true);
            setIsPaused(false);
            setDuration(0);
        } catch (err){
            Alert.alert('Error', 'Could not start recording.');
            console.error(err);
        }   
    }

    async function pauseRecording() {
        try{
            audioRecorder.pause();
            setIsPaused(true);
        } catch (err){
            console.error(err);
        }
    }

    async function resumingRecording(){
        try{
            audioRecorder.record();
            setIsPaused(false);
        }catch(err){
            console.error(err);
        }
    }

    async function stopRecording(){
        try{
            await audioRecorder.stop();
            const uri = audioRecorder.uri;
            console.log("Recorded URI", uri)

            const lectureData = {
                id: Date.now().toString(),
                subject: subject.trim(),
                date, time, duration: formatDuration(duration),
                audioUri: uri,
                status:'recorded',
                flashcards: [],
                notes: '',
                examHints: [],
                createdAt: new Date().toISOString(),
            };

            const existing = await AsyncStorage.getItem('lectures');
            const lectures = existing?JSON.parse(existing):[];
            lectures.unshift(lectureData);
            await AsyncStorage.setItem('lectures', JSON.stringify(lectures));

            setIsRecording(false);
            setIsPaused(false);
            setDuration(0);
            setSubject('');

            Alert.alert(
                'LECTURE SAVED!',
                `${subject} - ${formatDuration(duration)}`,
                [
                    {text: 'later', style: 'cancel'},
                    {
                        text: 'process now →',
                        onPress: () => {
                            setPendingId(lectureData.id);
                            console.log("=== set pendingId:", lectureData.id);
                            router.navigate('/(tabs)/process');
                            }
                        ,
                    },
                ]
            );

        } catch(err){
            Alert.alert('Error', 'Could not stop recording.');
            console.error(err);
        }
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar style="dark"/>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                <View style={[styles.heroCard, {backgroundColor: subjectColor}]}>
                    {!isRecording? (
                        <>
                            <Text style={styles.heroText}>
                                you suck at{'\n'}taking notes{'\n'}brother, {'\n'}we gotchu ;)
                            </Text>
                            <Text style={styles.heroSub}>drop the subject below..</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.heroText}>{isPaused ? 'take a{"\n"} breather' : `recording\n${subject}\ncovered`}</Text>
                            <Text style={styles.heroSub}>{isPaused ? 'resume when ready' : `screen can be off we gotchu!`}</Text>
                        </>
                    )}
                </View>

                {!isRecording && (
                    <View style={[styles.subjectCard , {backgroundColor: T.COLORS.pastelGreen}]}>
                        <Text style={styles.cardLabel}>SUBJECT</Text>
                        <TextInput style={styles.subjectInput} placeholder="e.g. Math, Biology, History..."placeholderTextColor={T.COLORS.lightSubtle} value={subject} onChangeText={setSubject} autoCapitalize="words"/>
                    </View>
                )}

                <View style={styles.metaRow}>
                    <View style={[styles.metaCard, {backgroundColor: T.COLORS.pastelPurp,}]}>

                        <Text style={styles.metaLabel}>Date</Text>
                        <Text style={styles.metaValue}>{date}</Text>

                    </View>

                    <View style={[styles.metaCard, {backgroundColor: T.COLORS.pastelOrange, }]}>
                        <Text style={styles.metaLabel}>Time</Text>
                        <Text style={styles.metaValue}>{time}</Text>
                    </View>
                </View>

                <Animated.View style={[styles.timerCard, {
                    backgroundColor: isRecording ? (isPaused?T.COLORS.pastelOrange:T.COLORS.pastelPink): T.COLORS.myWhite,
                }]}>
                    <Text style={styles.timer}>{formatDuration(duration)}</Text>
                    <Text style={styles.timerStatus}>
                        { !isRecording ? 'ready to record': isPaused? 'paused': '🔴 recording'}
                    </Text>
                </Animated.View>

                <View style={styles.buttonArea}>
                    {!isRecording ? (
                        <TouchableOpacity style={[styles.mainBtn, {
                            backgroundColor: T.COLORS.lightText
                        }]} onPress={startRecording} activeOpacity={0.85}>
                            <Text style={[styles.mainBtnText, {color: T.COLORS.lightBg}]}>
                                start recording
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.controlRow}>
                            <TouchableOpacity style={[styles.controlBtn, {
                                backgroundColor: isPaused ? T.COLORS.pastelGreen : T.COLORS.pastelOrange
                            }]} onPress={isPaused? resumingRecording:pauseRecording} activeOpacity={0.8}>
                                <Text style={styles.controlBtnText}>
                                    {isPaused ? 'RESUME' : 'PAUSE'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.controlBtn, {backgroundColor: T.COLORS.pastelPink}]} onPress={stopRecording} activeOpacity={0.8}>
                                <Text style={styles.controlBtnText}>STOP</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {!isRecording && (
                    <Text style={styles.tip}>💡 youre advised to sit close to the speak for best results</Text> 
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex:1,
        backgroundColor: T.COLORS.lightBg,
    },
    scroll: {
        paddingHorizontal: T.SPACING.md,
        paddingTop: T.SPACING.md,
        paddingBottom: T.SPACING.xxl,
    }, 
    
    heroCard: {
        borderRadius: 28,
        padding: 28,
        marginBottom: -12,
        transform: [{rotate: '-1.5deg'}],
        zIndex: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 2,
            height: 6,
        },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 5,
    }, 

    heroText: {
        fontSize: 46,
        fontFamily: T.FONTS_FAMILY.extrabold,
        color: T.COLORS.lightMuted,
        letterSpacing: -2,
        lineHeight: 42,
    }, 

    heroSub: {
        fontSize: T.FONT.md,

        color: T.COLORS.lightText,
        opacity: 0.6,
        marginTop: 12,
        fontFamily: T.FONTS_FAMILY.bold,
    },
    
    subjectCard: {
        borderRadius: 24,
        padding: 14,
        marginBottom: 2,
        transform: [{rotate: '-1deg'}],
        zIndex: 2,
        shadowColor: '#000',
        alignSelf: 'center',
        minWidth: '55%',
        shadowOffset: {
            width: 2,
            height: 6,
        }, shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },

    cardLabel: {
        fontSize: T.FONT.xs,
        fontFamily: T.FONTS_FAMILY.extrabold,
        color: T.COLORS.lightText,
        letterSpacing: 1.5,
        opacity: 0.45,
        marginBottom: 5,
    },

    subjectInput: {
        fontSize: 22,
        fontFamily: T.FONTS_FAMILY.bold,
        color: T.COLORS.lightText,
        letterSpacing: -1,
    },
    
    metaRow: {
        flexDirection: 'row',
        gap:10,
        marginBottom: T.SPACING.md,
        zIndex: 3,
    },
    metaCard: {
        flex:1, 
        borderRadius: 20, 
        alignItems:'center', 
        marginTop: 20,
        gap: 4, 
        padding: T.SPACING.md,
        shadowColor: '#000',
        shadowOffset: {
            width: 1,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    metaLabel: {fontSize: T.FONT.xs,
        color: T.COLORS.lightMuted,
        fontFamily: T.FONTS_FAMILY.bold,
        letterSpacing: 3,
    },
    metaValue: {
        fontSize: 13,
        color: T.COLORS.lightText,
        fontFamily: T.FONTS_FAMILY.bold,
        textAlign: 'center',
    }, 
    
    timerCard: {
        alignItems: 'center', 
        marginBottom: T.SPACING.lg,
        marginTop: 5,
        padding: 18,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: {
            width: 2,
            height: 6,
        },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 8,

    },
    timer: {
        fontSize: 80,
        fontFamily: T.FONTS_FAMILY.extrabold,
        color: T.COLORS.lightText,
        letterSpacing: -4,
        marginTop: -15,
    }, 
    timerStatus: {
        fontSize: T.FONT.md,
        color: T.COLORS.lightText,
        marginTop: 4,
        opacity: 0.5,
        letterSpacing: 1,
        fontFamily: T.FONTS_FAMILY.bold,
    }, 
    
    buttonArea: {
        alignItems: 'center',
        marginBottom: T.SPACING.md,
        zIndex: 5,
    }, 
    
    mainBtn: {
        backgroundColor: T.COLORS.lightText,
        paddingHorizontal: 52, paddingVertical: 20,
        borderRadius: T.RADIUS.full,
        shadowColor: '#000',
        shadowOffset: {width:0,
            height: 6
        },
        shadowOpacity: 0.2,
        shadowRadius: 14,
        elevation: 10,
    },
    mainBtnText:{
        fontSize: T.FONT.lg,
        fontFamily: T.FONTS_FAMILY.extrabold,
        color: T.COLORS.lightBg,
        letterSpacing: -0.5,
        marginTop: -4,
    },

    controlRow: {
        flexDirection: 'row',
        gap: 12,
    },

    controlBtn: {
        paddingHorizontal: 32,
        paddingVertical: T.SPACING.md,
        borderRadius: T.RADIUS.full,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },

    controlBtnText: {
        color: T.COLORS.lightText,
        fontSize: T.FONT.base,
        fontFamily: T.FONTS_FAMILY.bold,
        letterSpacing: -3,
    },
    tip: {
        textAlign: 'center', color: T.COLORS.lightSubtle,
        fontSize: T.FONT.sm,
        fontFamily: T.FONTS_FAMILY.bold,
        lineHeight: 20,
        marginTop: T.SPACING.sm,
    }
}) 