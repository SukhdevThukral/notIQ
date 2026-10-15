import { useEffect, useState, useRef } from "react";
import {View, Text, TextInput, StyleSheet, StatusBar, Animated, Alert} from 'react-native';


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

        } catch(err){

        }
    }
}