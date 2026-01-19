
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 校驗使用者手動輸入的日柱是否與日期相符
 */
export const verifyBaziPillar = async (
  date: string, 
  userPillar: string
): Promise<{ isValid: boolean; message: string }> => {
  if (!date || !userPillar) return { isValid: true, message: "" };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一位精通萬年曆的命理大師。請嚴格校驗：
      日期：${date}
      使用者自稱的日柱：${userPillar}
      
      請確認該日期的真實日柱。如果不符，請回傳 isValid: false 並給予解釋。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            message: { type: Type.STRING }
          },
          required: ["isValid", "message"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("校驗失敗", error);
    return { isValid: true, message: "" };
  }
};

/**
 * 核心校驗函式：針對計算出的四柱進行二次審核與修正
 * 確保從西曆轉換過來的八字符合權威萬年曆規律（如節氣切換、早晚子時等）
 */
export interface BaziPillars {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
}

export const validateAndFixBazi = async (
  date: string,
  time: string,
  currentPillars: BaziPillars
): Promise<{ pillars: BaziPillars; corrected: boolean; note?: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `身為權威萬年曆校對官，請核對以下排盤結果是否完全準確：
      輸入日期：${date} ${time}
      目前計算出的四柱：年[${currentPillars.yearPillar}], 月[${currentPillars.monthPillar}], 日[${currentPillars.dayPillar}], 時[${currentPillars.hourPillar}]
      
      校核重點：
      1. 是否跨越節氣（如立春、雨水等）導致月柱變更？
      2. 是否為早子時/晚子時導致日柱變更？
      3. 該日天干地支是否確實為上述結果？
      
      如果發現錯誤，請直接提供正確的四柱。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isAccurate: { type: Type.BOOLEAN },
            pillars: {
              type: Type.OBJECT,
              properties: {
                yearPillar: { type: Type.STRING },
                monthPillar: { type: Type.STRING },
                dayPillar: { type: Type.STRING },
                hourPillar: { type: Type.STRING }
              }
            },
            correctionNote: { type: Type.STRING, description: "修正原因，若無則留空" }
          },
          required: ["isAccurate", "pillars"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return {
      pillars: result.pillars,
      corrected: !result.isAccurate,
      note: result.correctionNote
    };
  } catch (error) {
    console.error("二次校驗失敗", error);
    return { pillars: currentPillars, corrected: false };
  }
};
