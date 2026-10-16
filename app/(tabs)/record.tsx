import { useEffect, useState, useRef } from "react";
import * as T from '@/constants';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Platform, Alert} from 'react-native';


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

    useEffect(() => {
        if(isRecording && !isPaused){
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulsingAnimation, {toValue: 1.2, duration: 800, useNativeDriver: true,}),
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
            Alert.alert('Add a subject', 'Enter the subject before recording.');
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
            <StatusBar style="light"/>

            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.heading}>Record New Lecture</Text>
                    <Text style={styles.subHeading}>Start recording your class</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Subject</Text>
                    <TextInput style={styles.input} placeholder="e.g. Math, History, Physics..." placeholderTextColor={T.COLORS.muted} value={subject} onChangeText={setSubject} editable={!isRecording} autoCapitalize="words"/>
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaIcon}>📅</Text>
                        <Text style={styles.metaLabel}>Date</Text>
                        <Text style={styles.metaValue}>{date}</Text>
                    </View>
                    <View style={styles.metaCard}>
                        <Text style={styles.metaIcon}>🕐</Text>
                        <Text style={styles.metaLabel}>Time</Text>
                        <Text style={styles.metaValue}>{time}</Text>
                    </View>
                </View>

                <View style={styles.notice}>
                    <Text style={styles.noticeText}>
                        🔒 Recording continues when the screen is off
                    </Text>
                </View>

                <View style={styles.timerContainer}>
                    <Text style={styles.timer}>{formatDuration(duration)}</Text>
                    {isRecording && (
                        <Text style={styles.timerStatus}>
                            {isPaused?'⏸ PAUSED' : '🔴 RECORDING'}
                        </Text>
                    )}
                </View>

                <View style={styles.buttonArea}>
                    {!isRecording ? (
                        <Animated.View style={{transform: [{scale: pulsingAnimation}] }}>
                            <TouchableOpacity style={styles.recordBtn} onPress={startRecording} activeOpacity={0.9}>
                                <Text style={styles.recordBtnText}>Start Recording</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <View style={styles.controlRow}>
                            <TouchableOpacity style={styles.pauseBtn} onPress={isPaused?resumingRecording : pauseRecording} activeOpacity={0.8}>
                                <Text style={styles.pauseBtnText}>
                                    {isPaused ? '▶ RESUME': '⏸ PAUSE'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex:1,
        backgroundColor: T.COLORS.bg,
    },
    container: {
        flex:1,
        paddingHorizontal: T.SPACING.md,
        paddingTop: T.SPACING.sm,
    }, header: {marginBottom: T.SPACING.xl,}, heading: {
        fontSize: T.FONT.xxl,
        fontWeight: '800',
        color: T.COLORS.myWhite,
        letterSpacing: -1,
    }, 
    subHeading: {
        fontSize: T.FONT.md,
        color: T.COLORS.muted,
        marginTop: T.SPACING.xs,
    }, inputGroup: {marginBottom: T.SPACING.md,},
    label:{
        fontSize: T.FONT.xs,
        fontWeight: '700',
        color: T.COLORS.muted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: T.SPACING.sm,
    }, input: {
        backgroundColor: T.COLORS.surface,
        borderRadius: T.RADIUS.md,
        borderWidth: 1,
        borderColor: T.COLORS.border,
        padding: T.SPACING.md,
        fontSize: T.FONT.base,
        color: T.COLORS.myWhite,
        fontWeight: '600',
    }, metaRow: {
        flexDirection: 'row',
        gap:12,
        marginBottom: T.SPACING.md,
    },
    metaCard: {
        flex:1, backgroundColor: T.COLORS.surface, borderRadius: T.RADIUS.md, borderWidth: 1, borderColor: T.COLORS.border, padding: 14, alignItems:'center', gap: T.SPACING.xs,
    },
    metaIcon: {fontSize: 20,},
    metaLabel: {fontSize: T.FONT.xs,
        color: T.COLORS.muted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metaValue: {
        fontSize: T.FONT.sm,
        color: T.COLORS.myWhite,
        fontWeight: '700',
        textAlign: 'center',
    },
    notice: {
        backgroundColor: T.COLORS.purple + '15',
        borderRadius: T.RADIUS.sm,
        borderWidth: 1,
        borderColor: T.COLORS.purple + '33',
        paddingVertical: T.SPACING.sm + 2,
        paddingHorizontal: T.SPACING.md,
        marginBottom: T.SPACING.xl,
    }, noticeText: {
        color: T.COLORS.purple,
        fontSize: T.FONT.sm,
        fontWeight: '600',
        textAlign: 'center',
    }, timerContainer: {alignItems: 'center', marginBottom: T.SPACING.xxl,},
    timer: {
        fontSize: 64,
        fontWeight: '800',
        color: T.COLORS.myWhite,
        letterSpacing: -2,
    }, timerStatus: {
        fontSize: T.FONT.md,
        color: T.COLORS.muted,
        marginTop: T.SPACING.xs + 2,
        fontWeight: '600',
    }, buttonArea: {
        alignItems: 'center',
        marginBottom: T.SPACING.lg,
    }, recordBtn: {
        backgroundColor: T.COLORS.purple, paddingHorizontal: 48, paddingVertical: 18,
        borderRadius: T.RADIUS.full,
        shadowColor: T.COLORS.purple,
        shadowOffset: {width:0,
            height: 8
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },

    recordBtnText:{
        color: T.COLORS.myWhite,
        fontSize: T.FONT.lg,
        fontWeight: '800',
        letterSpacing: -0.3,
    },

    controlRow: {
        flexDirection: 'row',
        gap: T.SPACING.md,
        alignItems: 'center',
    },

    pauseBtn: {
        backgroundColor: T.COLORS.surface,
        borderWidth: 1,
        borderColor: T.COLORS.border,
        paddingHorizontal: 28,
        paddingVertical: T.SPACING.md,
        borderRadius: T.RADIUS.full,
    },

    pauseBtnText: {
        color: T.COLORS.myWhite,
        fontSize: T.FONT.base - 1,
        fontWeight: '700',
    },
}) 