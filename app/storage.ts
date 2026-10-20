import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lecture } from "./types";

const KEY = "lectures";

export async function getLectures(): Promise<Lecture[]> {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw)  : [];
}

export async function saveLectures(lectures:Lecture[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(lectures))
}

export async function upsertLecture(updated: Lecture): Promise<Lecture[]> {
    const all = await getLectures();
    const next = all.map((l)=> (l.id === updated.id ? updated : l));
    await saveLectures(next);
    return next;
}