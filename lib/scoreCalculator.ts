// lib/scoreCalculator.ts

export interface ScoreBreakdown {
  distanceScore: number;
  heartrateScore: number;
  consistencyBonus: number;
  totalScore: number;
}

/**
 * Bereken afstand score: 10 punten per kilometer
 */
export function calculateDistanceScore(distanceMeters: number): number {
  const kilometers = distanceMeters / 1000;
  return Math.round(kilometers * 10 * 100) / 100; // 2 decimalen
}

/**
 * Bereken hartslag score op basis van zones
 */
export function calculateHeartrateScore(
  averageHeartrate: number | null,
  movingTimeSeconds: number,
  maxHeartRate: number = 190
): number {
  if (!averageHeartrate || averageHeartrate === 0) {
    return 0; // Geen hartslagdata
  }

  const movingTimeMinutes = movingTimeSeconds / 60;
  const percentageOfMax = (averageHeartrate / maxHeartRate) * 100;

  let pointsPerMinute = 0;

  if (percentageOfMax < 60) {
    // Zone 1: < 60%
    pointsPerMinute = 0.5;
  } else if (percentageOfMax < 70) {
    // Zone 2: 60-70%
    pointsPerMinute = 1;
  } else if (percentageOfMax < 80) {
    // Zone 3: 70-80%
    pointsPerMinute = 2;
  } else if (percentageOfMax < 90) {
    // Zone 4: 80-90%
    pointsPerMinute = 4;
  } else {
    // Zone 5: > 90%
    pointsPerMinute = 7;
  }

  return Math.round(movingTimeMinutes * pointsPerMinute * 100) / 100;
}

/**
 * Check of deze run de 3e+ run is in de huidige week (maandag t/m zondag)
 */
export function calculateConsistencyBonus(
  currentRunDate: Date,
  previousRunsThisWeek: number
): number {
  // Als dit de 3e run of meer is deze week, geef 50 punten
  if (previousRunsThisWeek >= 2) {
    return 50;
  }
  return 0;
}

/**
 * Bereken het weeknummer voor een datum (maandag = start van week)
 */
export function getWeekInfo(date: Date): { year: number; week: number } {
  const tempDate = new Date(date.getTime());
  
  // Zet naar maandag van deze week
  const day = tempDate.getDay();
  const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
  tempDate.setDate(diff);
  
  // Bereken week nummer
  const startOfYear = new Date(tempDate.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((tempDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  
  return {
    year: tempDate.getFullYear(),
    week: weekNumber
  };
}

/**
 * Hoofdfunctie: bereken totale score voor een run
 */
export function calculateRunScore(
  distanceMeters: number,
  movingTimeSeconds: number,
  averageHeartrate: number | null,
  maxHeartRate: number,
  previousRunsThisWeek: number
): ScoreBreakdown {
  const distanceScore = calculateDistanceScore(distanceMeters);
  const heartrateScore = calculateHeartrateScore(
    averageHeartrate,
    movingTimeSeconds,
    maxHeartRate
  );
  const consistencyBonus = calculateConsistencyBonus(
    new Date(),
    previousRunsThisWeek
  );

  const totalScore = distanceScore + heartrateScore + consistencyBonus;

  return {
    distanceScore,
    heartrateScore,
    consistencyBonus,
    totalScore: Math.round(totalScore * 100) / 100
  };
}