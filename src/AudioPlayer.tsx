import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as T from '@/constants';

type Props = {
    uri: string;
};

export default function AudioPlayer({uri}: Props) {
    const player = useAudioPlayer({uri});
    const status = useAudioPlayerStatus(player);

    const isPlaying = status.playing;
    const duration = status.duration ?? 0;
    const position = status.currentTime ?? 0;

    const progress = duration > 0 ? position / duration : 0;

    function formatTime(seconds: number){
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);

        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function handleSeek(direction: 'forward' | 'back'){
        const delta = direction === 'forward' ? 10 : -10;
        player.seekTo(Math.max(0, Math.min(position + delta, duration)));
    }

    return(
        <View style={styles.container}>
            <Text style={styles.label}>lecture recording</Text>

            <View style={styles.progressBg}>
                <View style={[styles.progressFill, {width: `${progress*100}%`}]} />
            </View>

            <View style={styles.timeRow}>
                <Text style={styles.time}>{formatTime(position)}</Text>
                <Text style={styles.time}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity onPress={()=> handleSeek('back')} style={styles.skipBtn}>
                    <Text style={styles.skipText}>-10s</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.playBtn} onPress={
                    () => {
                        if (isPlaying) {
                            player.pause();
                        } else {
                            if (status.didJustFinish){
                                player.seekTo(0);
                            } player.play();
                        }
                    }
                } activeOpacity={0.8}>
                    <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={()=> handleSeek('forward')} style={styles.skipBtn}>
                    <Text style={styles.skipText}>+10s</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: T.COLORS.myWhite,
        borderRadius: 24,
        padding: T.SPACING.md,
        marginBottom: T.SPACING.md,
        shadowColor: '#000',
        shadowOffset: {
            width: 1, height: 4
        },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    label: {
        fontFamily: T.FONTS_FAMILY.extrabold,
        fontSize: T.FONT.sm,
        color: T.COLORS.lightText,
        letterSpacing: 1,
        opacity: 0.5,
        marginBottom: T.SPACING.sm,
    },

    progressBg: {
        height: 6,
        backgroundColor: T.COLORS.lightSubtle,
        borderRadius: T.RADIUS.full,
        overflow: 'hidden',
        marginBottom: T.SPACING.xs,
    },

    progressFill: {
        height: '100%',
        backgroundColor: T.COLORS.lightText,
        borderRadius: T.RADIUS.full,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: T.SPACING.sm,
    },
    time: {
        fontSize: T.FONT.xs,
        fontFamily: T.FONTS_FAMILY.bold,
        color: T.COLORS.lightSubtle,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: T.SPACING.lg,
    },
    playBtn: {
        backgroundColor: T.COLORS.lightText,
        width: 56,
        height: 56,
        borderRadius: T.RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playIcon: {
        fontSize: 22,
        color: T.COLORS.lightBg,
    },
    skipBtn:{
        backgroundColor: T.COLORS.pastelPurp,
        paddingHorizontal: T.SPACING.md,
        paddingVertical: T.SPACING.sm,
        borderRadius: T.RADIUS.full,
    },
    skipText:{
        fontFamily: T.FONTS_FAMILY.bold,
        fontSize: T.FONT.sm ,
        color: T.COLORS.lightText,
    },
})