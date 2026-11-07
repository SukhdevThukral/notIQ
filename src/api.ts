import { flashCard } from "./types"
import * as FileSystem from 'expo-file-system/legacy';


const assemblyAI_key = process.env.EXPO_PUBLIC_ASSEMBLYAI_KEY!;

export async function transcribeAudio(audioUri :string):Promise<string>{

    const uploadRes = await FileSystem.uploadAsync(
        "https://api.assemblyai.com/v2/upload", audioUri, {
            httpMethod: "POST",  
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: {
                authorization: assemblyAI_key,
            },
        }
    );
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
            setTimeout(r, 1500)
        });

        const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
            headers: {
                authorization : assemblyAI_key
            },
        });

        const result = await poll.json();
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
    const prompt = `a student recorded a ${subject} lecture. Here is the EXACT transcript: 
     
    <transcript>
    ${transcript}
    </transcript>

    Your job is to ONLY use what is said in the transcript above, do NOT add outside knowledge, do NOT make up content, do NOT expand beyond what was literally spoken.

    NOTES  RULES: 
    - Write proper structured notes, NOT a transcript dump or bullet-point list of everything said.
    - Identify  the key concepts, definitions, and explanations the teacher gave
    - Group related ideas under ## headings by topic
    - Summarise and rephrase in clear student freindly langauge
    - Use bullet points only for genuine list type content (steps, examples, comparisons or etc.)
    - Bold (**example**) only the most important terms or definitions

    EXAM HINT RULES:
    - ONLY include something if the teacher EXPLICITLY said it will be on the exam
    - OR if the teacher repeated or heavily emphasised a specific point multiple times
    - OR if the teacher slowed down, spelled something out, or said "remember this", "dont  forget", "pay attention to this" or etc.
    - If none of these signals exist in the transcript, just  return an empty array []
    - Do NOT just list topics that seem academically important - only what the teacher flagged

    FLASHCARD RULES:
    - Create question/answer pairs based only on key concepts from the transcript
    - Questions should test understanding, not just recall of random sentences

    return ONLY a valid JSON object with this exact shape:
    {
        "notes" : "structured notes using markdown",
        "flashcards": [{"front": "question based ONLY on transcript content", "back" : "answer from transcript ONLY"}],
        "examHints": ["only explicitly flagged or heavily repeated content"]
    }

    If the transcript has very little academic content, reflect that  with absolute honesty,short notes, few flashcards. Do NOT pad or invent.
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_KEY}`  , {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            contents:[{parts: [{text:prompt}] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
            },
            systemInstruction:{
                parts: [{text: "You are a fast, concise note-taking assisstant. Be brief and effecient. Never over-explain."}]
            }
        }),
    });

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    const cleaned = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleaned);
    } catch{ 
        throw new Error("AI returned invalid JSON - try again");
    }
}
