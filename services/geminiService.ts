import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Converts a solar date to Bazi pillars using Google Search to access reliable perpetual calendar data.
 */
export const getBaziFromSolar = async (date: string, time: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `請利用 Google 搜尋查閱權威萬年曆資料，將以下公曆日期轉換為精確的八字四柱（年、月、日、時）：
    日期：${date}
    時間：${time}
    
    請特別注意：
    1. 節氣的精確切換時間（決定月柱）。
    2. 早子時與晚子時的區分（決定日柱）。
    
    請以 JSON 格式回傳。`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          yearPillar: { type: Type.STRING },
          monthPillar: { type: Type.STRING },
          dayPillar: { type: Type.STRING },
          hourPillar: { type: Type.STRING }
        }
      }
    }
  });
  
  const text = response.text;
  if (!text) return {};
  return JSON.parse(text);
};

/**
 * Analyzes the Bazi pillars for Indirect Wealth (Pian Cai) strength.
 */
export const analyzeProvidedBazi = async (year: string, month: string, day: string, hour: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `身為一位專業的八字命理大師，請深入分析以下四柱命盤的「偏財運」（橫財運）：
    年柱：${year}
    月柱：${month}
    日柱：${day}
    時柱：${hour}
    
    請提供：
    - elementBalance: 五行能量比例。
    - summary: 命盤精簡批註。
    - pianCaiStrength: 偏財運強弱等級（極強/旺相/中平/偏弱/極弱）。
    - pianCaiAnalysis: 關於偏財運與命局互動（生剋合沖）的詳細解釋。
    
    請以 JSON 格式回傳。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          elementBalance: { type: Type.STRING },
          summary: { type: Type.STRING },
          pianCaiStrength: { type: Type.STRING },
          pianCaiAnalysis: { type: Type.STRING }
        }
      }
    }
  });
  
  const text = response.text;
  if (!text) return {};
  return JSON.parse(text);
};

/**
 * Generates lucky numbers and betting time using Google Search to find actual upcoming Mark Six draw dates.
 */
export const getLuckyNumbers = async (user: any) => {
  const today = new Date().toISOString().split('T')[0];
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `請執行以下步驟：
    1. 使用 Google 搜尋找出香港賽馬會六合彩（Mark Six）在 ${today} 之後最近的攪珠日期。
    2. 參考萬年曆，確認該建議日期的天干地支（日柱）。
    3. 基於命主四柱：年：${user.yearPillar}, 月：${user.monthPillar}, 日：${user.dayPillar}, 時：${user.hourPillar}，結合其偏財運特徵，計算 7 個開運號碼。
    
    請回傳：
    - numbers: 7 個 1-49 的數字。
    - bettingTime: 該日最適合命主的投注時辰。
    - auspiciousDate: 建議日期（必須包含日期與當日干支，例如：2024-10-15 (甲辰日)）。
    - explanation: 號碼與時辰的命理選擇邏輯。
    
    請以 JSON 格式回傳。`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          numbers: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          bettingTime: { type: Type.STRING },
          explanation: { type: Type.STRING },
          auspiciousDate: { type: Type.STRING }
        }
      }
    }
  });
  
  const text = response.text;
  if (!text) return { numbers: [], explanation: '', auspiciousDate: '', bettingTime: '' };
  
  const result = JSON.parse(text);
  // Extract grounding sources for UI display
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    result.sources = groundingChunks.map((chunk: any) => chunk.web).filter(Boolean);
  }
  
  return result;
};