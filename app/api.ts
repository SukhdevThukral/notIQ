import { flashCard } from "./types"

const openrouter_key = "";
const assemblyAI_key = "";

export async function transcribeAudio(audioUri :string):Promise<string>{
    const formData = new FormData();

    formData.append("file", {
        uri: audioUri, name: "lectture.m4a",
        type: "audio/m4a"
    } as any);

    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST", headers: {
            authorization: assemblyAI_key
        }, body: formData,
    });

    const {upload_url} = await uploadRes.json();

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
        "examHint": ["likely exam question or high priority concept as a short string"]
    }

    Rules:  
    - notes: comprehensive but scannable, use ## for sections, bold key terms
    - flashcards: 8-15 cards covering the most 
    - examHints: 5-8 specific things likely to appear on an exam
    `;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${openrouter_key}`,
        },
        body: JSON.stringify({
            model: "openrouter/free",
            messages: [{
                role: "user",
                content: prompt
            }],
        }),
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";

    return JSON.parse(raw);
}
