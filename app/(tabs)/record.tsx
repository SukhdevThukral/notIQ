import { useEffect, useState, useRef } from "react";
import * as T from '@/constants';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Animated, Platform, Alert} from 'react-native';


import { SafeAreaView } from "react-native-safe-area-context";
import {Audio} from 'expo-av';
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    const [recording, setRecording] = useState<Audio.Recording | null>(null);

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
        const {status} = await Audio.requestPermissionsAsync();
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
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: false,
            });

            const {recording} = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecording(true);
            setIsPaused(false);
            setDuration(0);
        } catch (err){
            Alert.alert('Error', 'Could not start recording.');
            console.error(err);
        }   
    }

    async function pauseRecording() {
        if (!recording){return;}

        try{
            await recording.pauseAsync();
            setIsPaused(false);
        } catch (err){
            console.error(err);
        }
    }

    async function resumingRecording(){
        if (!recording){
            return;
        }
        try{
            await recording.startAsync();
            setIsPaused(false);
        }catch(err){
            console.error(err);
        }
    }

    async function stopRecording(){
        if (!recording){
            return;
        }
        try{
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

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
            setRecording(null);
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
            <StatusBar barStyle="light-content" backgroundColor={T.COLORS.bg}/>

            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.heading}>Record New Lecture</Text>
                    <Text style={styles.subHeading}>Start recording your class</Text>
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
    }
}) 