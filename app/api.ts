import { flashCard } from "./types"
import * as FileSystem from 'expo-file-system/legacy';

console.log("KEYS:", process.env.EXPO_PUBLIC_GEMINI_KEY, process.env.EXPO_PUBLIC_ASSEMBLYAI_KEY)

console.log("GEMINI KEY:", process.env.EXPO_PUBLIC_GEMINI_KEY);
const assemblyAI_key = process.env.EXPO_PUBLIC_ASSEMBLYAI_KEY!;

export async function transcribeAudio(audioUri :string):Promise<string>{

    console.log("=== uploading: ", audioUri);

    const uploadRes = await FileSystem.uploadAsync(
        "https://api.assemblyai.com/v2/upload", audioUri, {
            httpMethod: "POST",  
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: {
                authorization: assemblyAI_key,
            },
        }
    );

    console.log("=== upload result:", uploadRes.body);

    const {upload_url} = JSON.parse(uploadRes.body);

    const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST", headers: {
            authorization: assemblyAI_key, "content-type" : "application/json"
        }, 
        body: JSON.stringify({audio_url: upload_url}),
    })

    const {id}= await transcriptRes.json();

    while(true){
        await new Promise((r)=> {
            setTimeout(r, 3000)
        });

        const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
            headers: {
                authorization : assemblyAI_key
            },
        });

        const result = await poll.json();

        console.log("-> poll status:", result.status);
        if(result.status === "completed"){
            return result.text as string;
        }

        if (result.status === "error"){
            throw new Error(result.error);
        }
    }
}

export async function processingWithAI(
    transcript : string,
    subject: string
) : Promise<{notes: string; flashcards: flashCard[]; examHints: string[]}> {
    const prompt = `you are an expert academic assistand and a student just recorded a ${subject} lecture. and here is the transcript: 
    
    <transcript>
    ${transcript}
    </transcript>

    return ONLY a valid JSON object (no markdown, no explanation) with this exact shape:
    {
        "notes" : "well-structured markdown notes with heading, bullet points, and key concepts highlighted",
        "flashcards": [{"front": "question or term", "back" : "answer or definition"}],
        "examHints": ["likely exam question or high priority concept as a short string"]
    }

    Rules:  
    - notes: comprehensive but scannable, use ## for sections, bold key terms
    - flashcards: 8-15 cards covering the most 
    - examHints: 5-8 specific things likely to appear on an exam
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_KEY}`  , {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            contents:[{parts: [{text:prompt}]}]
        }),
    });

    const data = await res.json();
    console.log("---> raw ai response:", JSON.stringify(data));
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    console.log("---> raw content:", raw);

    const cleaned = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleaned);
    } catch{ 
        throw new Error("AI returned invalid JSON - try again");
    }
}
