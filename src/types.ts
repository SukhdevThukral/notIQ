export type flashCard  = {
    front: string, back: string,
}

export type Lecture = {
    id: string, subject: string, date: string, time: string,
    duration: string, audioUri: string | null, 
    status: "recorded" | "processing" | "done" | "error",
    flashcards: flashCard[];
    notes: string;
    examHints: string[];
    transcript?: string;
    createdAt: string;
};


export type Tab = "notes" | "flashcards" | "hints";