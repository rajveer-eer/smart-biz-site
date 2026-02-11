import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBusinessAdvice = async (
  query: string,
  appState: AppState,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> => {
  try {
    const systemContext = `
      You are SmartBiz AI, an expert business consultant for small shop owners (e.g., kirana, salon, cafe).
      
      Current Business Data Context:
      - Currency: Indian Rupee (₹)
      - Inventory Count: ${appState.inventory.length} items
      - Low Stock Items: ${appState.inventory.filter(i => i.stock <= i.lowStockThreshold).map(i => `${i.name} (${i.stock} left)`).join(', ') || 'None'}
      - Total Transactions: ${appState.transactions.length}
      - Recent Transactions (Last 5): ${JSON.stringify(appState.transactions.slice(0, 5))}
      
      Your Goal:
      - Provide actionable, short, and simple advice.
      - Focus on profitability, inventory management, and customer retention.
      - If the user asks about their data, use the provided context to answer accurately.
      - Keep the tone encouraging and professional but easy to understand.
    `;

    const model = 'gemini-3-flash-preview';
    
    // Construct the chat history for the API
    // We only pass text history here for simplicity in this stateless service call wrapper
    // Ideally, we'd use ai.chats.create() for a persistent session, but here we do single-turn with history context if needed.
    
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: systemContext + "\n\nUser Query: " + query }] }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster response on simple queries
      }
    });

    return response.text || "I couldn't generate a response at the moment. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the AI service right now. Please check your internet connection.";
  }
};