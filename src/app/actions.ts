"use server";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function getTeslaAnalysis(chatHistory: any[]) {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are the Tesla Neural Network. You are sleek, elite, and data-driven. Analyze $TSLA and the ecosystem with extreme precision." },
        ...chatHistory
      ],
    });
    return { success: true, message: response.choices[0].message.content };
  } catch (error) {
    return { success: false, message: "Neural link offline. Please recalibrate." };
  }
}