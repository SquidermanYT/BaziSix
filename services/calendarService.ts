import { Solar } from 'lunar-javascript';

export interface BaziResult {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
}

export interface MarkSixCandidate {
  date: string;
  dayOfWeek: string;
  dayPillar: string;
}

/**
 * 使用本地庫將公曆轉換為八字。
 */
export const getBaziLocally = (dateStr: string, timeStr: string): BaziResult => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    
    // 設置晚子時換日 (Sect 2)
    eightChar.setSect(2);

    // 解決 getHour 可能缺失的健壯性寫法
    return {
      yearPillar: eightChar.getYear(),
      monthPillar: eightChar.getMonth(),
      dayPillar: eightChar.getDay(),
      hourPillar: typeof eightChar.getHour === 'function' ? eightChar.getHour() : lunar.getTimeInGanZhi()
    };
  } catch (error) {
    console.error('本地八字計算失敗:', error);
    // 降級方案
    const [year, month, day] = dateStr.split('-').map(Number);
    const solar = Solar.fromYmdHms(year, month, day, 12, 0, 0);
    const lunar = solar.getLunar();
    return {
      yearPillar: lunar.getYearInGanZhi(),
      monthPillar: lunar.getMonthInGanZhi(),
      dayPillar: lunar.getDayInGanZhi(),
      hourPillar: lunar.getTimeInGanZhi()
    };
  }
};

/**
 * 預測未來 7 天內可能的六合彩攪珠日（週二、四、六/日）及其八字
 */
export const getUpcomingMarkSixDates = (): MarkSixCandidate[] => {
  const candidates: MarkSixCandidate[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    
    const dayOfWeek = targetDate.getDay(); // 0 是週日, 2 是週二, 4 是週四, 6 是週六
    
    // 香港六合彩通常在週二、四、六或日
    if ([2, 4, 6, 0].includes(dayOfWeek)) {
      const dateStr = targetDate.toISOString().split('T')[0];
      const solar = Solar.fromYmdHms(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate(), 12, 0, 0);
      const bazi = solar.getLunar().getEightChar();
      
      const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
      
      candidates.push({
        date: dateStr,
        dayOfWeek: dayNames[dayOfWeek],
        dayPillar: bazi.getDay()
      });
    }
  }
  return candidates;
};

export const validateDayPillarLocally = (dateStr: string, userDayPillar: string): boolean => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const solar = Solar.fromYmdHms(year, month, day, 12, 0, 0);
    return solar.getLunar().getEightChar().getDay() === userDayPillar;
  } catch (e) {
    return true; 
  }
};