import { useEffect, useState, useRef } from "react";
import * as T from '@/constants';
import {View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Animated, Alert} from 'react-native';


import { SafeAreaView } from "react-native-safe-area-context";
import {useAudioRecorder, AudioModule, RecordingPresets} from 'expo-audio';
import AsyncStorage from "@react-native-async-storage/async-storage";

import {StatusBar} from 'expo-status-bar';

function getFormattedDate(){
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function getFormattedTime(){
    const now = new Date();
    return now.toLocaleTimeString('en-US',{
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDuration(seconds:number){
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function getSubjectColor(subject: string){
    if (!subject){
        return T.COLORS.pastelPurp;
    }
    const index = subject.charCodeAt(0) % T.PASTEL_COLORS.length;
    return T.PASTEL_COLORS[index]
}

export default function RecordingScreen(){
    const [subject,setSubject] = useState('');
    const [date] = useState(getFormattedDate());
    const [time] = useState(getFormattedTime());
    const [isRecording,setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);

    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const pulsingAnimation = useRef(new Animated.Value(1)).current;

    const subjectColor = getSubjectColor(subject);

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
                `${subject} - ${formatDuration(duration)}\n\nReady to process into notes.`
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
                <View style={styles.header}>
                    {!isRecording? (
                        <>
                            <Text style={styles.heading}>What are we{'\n'} learning today?</Text>
                            <Text style={styles.subHeading}>Drop the subject and hit record..</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.heading}>{isPaused ? 'take a breather' : `recording ${subject}`}</Text>
                            <Text style={styles.subHeading}>{isPaused ? 'resume when youre ready' : `screen can be off we gotchu!`}</Text>
                        </>
                    )}
                </View>

                {!isRecording && (
                    <View style={[styles.inputCard, {borderColor: subjectColor,backgroundColor: subjectColor + '33', }]}>
                        <Text style={styles.label}>SUBJECT</Text>
                        <TextInput style={styles.input} placeholder="e.g. Math, Biology, History..."placeholderTextColor={T.COLORS.lightSubtle} value={subject} onChangeText={setSubject} autoCapitalize="words"/>
                    </View>
                )}
                <View style={styles.metaRow}>
                    <View style={[styles.metaCard, {backgroundColor: T.COLORS.pastelPurp}]}>
                        <Text style={styles.metaIcon}>📅</Text>
                        <Text style={styles.metaLabel}>Date</Text>
                        <Text style={styles.metaValue}>{date}</Text>
                    </View>
                    <View style={[styles.metaCard, {backgroundColor: T.COLORS.pastelGreen}]}>
                        <Text style={styles.metaIcon}>🕐</Text>
                        <Text style={styles.metaLabel}>Time</Text>
                        <Text style={styles.metaValue}>{time}</Text>
                    </View>
                </View>

                <View style={[styles.timerCard, {
                    backgroundColor: isRecording? (isPaused?T.COLORS.pastelOrange: T.COLORS.pastelPink) : T.COLORS.myWhite,
                }]}>
                    <Text style={styles.timer}>{formatDuration(duration)}</Text>
                    <Text style={styles.timerStatus}>
                        {!isRecording? 'Ready to record' : isPaused ? '⏸ PAUSED' : '🔴 RECORDING'}
                    </Text>
                </View>

                <View style={styles.buttonArea}>
                    {!isRecording ? (
                        <Animated.View style={{transform: [{scale: pulsingAnimation}] }}>
                            <TouchableOpacity style={[styles.mainBtn, {
                                backgroundColor: subjectColor
                            }]} onPress={startRecording} activeOpacity={0.85}>
                                <Text style={styles.mainBtnText}>
                                    🎙️ Start Recording
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <View style={styles.controlRow}>
                            <TouchableOpacity style={[styles.controlBtn, {
                                backgroundColor: isPaused ? T.COLORS.pastelGreen : T.COLORS.pastelOrange
                            }]} onPress={isPaused? resumingRecording:pauseRecording} activeOpacity={0.8}>
                                <Text style={styles.controlBtnText}>
                                    {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.controlBtn, {backgroundColor: T.COLORS.pastelPink}]} onPress={stopRecording} activeOpacity={0.8}>
                                <Text style={styles.controlBtnText}>⏹ STOP</Text>
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
    }, header: {marginBottom: T.SPACING.lg,}, heading: {
        fontSize: 36,
        fontWeight: '900',
        color: T.COLORS.lightText,
        letterSpacing: -1,
        lineHeight: 42,
    }, 
    subHeading: {
        fontSize: T.FONT.md,
        color: T.COLORS.lightMuted,
        marginTop: T.SPACING.xs,
    }, inputCard: {marginBottom: T.RADIUS.lg,
        borderRadius: T.RADIUS.lg,
        borderWidth: 2,
        padding: T.SPACING.md,
    },
    label:{
        fontSize: T.FONT.xs,
        fontWeight: '800',
        color: T.COLORS.lightMuted,
        letterSpacing: 1.5,
        marginBottom: T.SPACING.xs,
    }, input: {
        fontWeight: '700',
        fontSize: T.FONT.lg,
        color: T.COLORS.lightText,
    }, metaRow: {
        flexDirection: 'row',
        gap:12,
        marginBottom: T.SPACING.md,
    },
    metaCard: {
        flex:1, 
        borderRadius: T.RADIUS.lg, alignItems:'center', gap: T.SPACING.xs, padding: T.SPACING.md,
    },
    metaIcon: {fontSize: 22,},
    metaLabel: {fontSize: T.FONT.xs,
        color: T.COLORS.lightMuted,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    metaValue: {
        fontSize: T.FONT.sm,
        color: T.COLORS.lightText,
        fontWeight: '800',
        textAlign: 'center',
    }, 
    
    timerCard: {alignItems: 'center', marginBottom: T.SPACING.lg,
        padding: T.SPACING.xl,
        borderRadius: T.RADIUS.lg + 6,
    },
    timer: {
        fontSize: 72,
        fontWeight: '900',
        color: T.COLORS.lightText,
        letterSpacing: -3,
    }, timerStatus: {
        fontSize: T.FONT.md,
        color: T.COLORS.lightMuted,
        marginTop: T.SPACING.xs,
        fontWeight: '700',
    }, buttonArea: {
        alignItems: 'center',
        marginBottom: T.SPACING.md,
    }, mainBtn: {
        paddingHorizontal: 48, paddingVertical: 18,
        borderRadius: T.RADIUS.full,
        shadowColor: '#000',
        shadowOffset: {width:0,
            height: 4
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    mainBtnText:{
        color: T.COLORS.lightText,
        fontSize: T.FONT.lg,
        fontWeight: '900',
        letterSpacing: -0.3,
    },

    controlRow: {
        flexDirection: 'row',
        gap: 12,
    },

    controlBtn: {
        paddingHorizontal: 28,
        paddingVertical: T.SPACING.md,
        borderRadius: T.RADIUS.full,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },

    controlBtnText: {
        color: T.COLORS.lightText,
        fontSize: T.FONT.base,
        fontWeight: '800',
    },
    tip: {
        textAlign: 'center', color: T.COLORS.lightSubtle,
        fontSize: T.FONT.sm,
        lineHeight: 20,
    }
}) 