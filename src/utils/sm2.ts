export interface SM2Data {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * SuperMemo-2 algorithm implementation
 * @param quality User rating from 0 to 5 (0: blank/forgot, 3: hard, 4: good, 5: perfect)
 * @param easeFactor Previous ease factor (default 2.5)
 * @param interval Previous interval in days (default 0)
 * @param repetitions Previous repetitions count (default 0)
 * @returns Updated SM2 data
 */
export function calculateSM2(
  quality: number,
  easeFactor: number = 2.5,
  interval: number = 0,
  repetitions: number = 0
): SM2Data {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Correctness check
  if (quality >= 3) {
    // Correct response
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(newInterval * newEaseFactor);
    }
    newRepetitions++;
    
    // Update ease factor based on quality (only for correct responses)
    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    // Incorrect response
    newRepetitions = 0;
    newInterval = 1;
    // According to original SM-2 algorithm, ease factor remains unchanged for quality < 3
  }

  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  // Set review date to start of the day to avoid time-of-day offsets
  const nextReviewDate = new Date();
  nextReviewDate.setHours(0, 0, 0, 0);
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate
  };
}
