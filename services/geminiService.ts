import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
  return text ? JSON.parse(text) : {};
};

/**
 * 基於本地提供的候選日期生成開運號碼
 */
export const getLuckyNumbers = async (user: any, candidates: any[]) => {
  const candidatesJson = JSON.stringify(candidates);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `命主八字：年：${user.yearPillar}, 月：${user.monthPillar}, 日：${user.dayPillar}, 時：${user.hourPillar}。
    
    以下是未來可能的六合彩攪珠日期及對應的本地萬年曆日柱：
    ${candidatesJson}
    
    請執行以下命理分析：
    1. 從候選日期中，挑選一個與命主「偏財運」最吻合、磁場最強的開運日期。
    2. 基於該日的天干地支與命主命盤的生剋關係，計算 7 個 1-49 的靈數。
    3. 提供一個最適合投注的時辰。
    
    請回傳：
    - numbers: 7 個 1-49 的數字。
    - bettingTime: 該日最適合命主的投注時辰。
    - auspiciousDate: 建議日期（需包含日期、星期與日柱）。
    - explanation: 號碼與日期挑選的命理邏輯。
    
    請以 JSON 格式回傳。`,
    config: {
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
  return text ? JSON.parse(text) : { numbers: [], explanation: '', auspiciousDate: '', bettingTime: '' };
};