import { useEffect, useState, useRef } from "react";
import {View, Text, TextInput, StyleSheet, StatusBar} from 'react-native';


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
}