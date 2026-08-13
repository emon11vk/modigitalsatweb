export function isMathAnswerEquivalent(userAnswer: string, correctAnswer: string): boolean {
  if (!userAnswer || !correctAnswer) return false;
  
  const u = userAnswer.trim().toLowerCase();
  const c = correctAnswer.trim().toLowerCase();
  
  if (u === c) return true;
  
  const parse = (val: string): number | null => {
    const cleanVal = val.replace(/,/g, '');
    
    if (cleanVal.includes('/')) {
      const parts = cleanVal.split('/');
      if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          return num / den;
        }
      }
    } else {
      if (/^-?\d*\.?\d+$/.test(cleanVal)) {
        return parseFloat(cleanVal);
      }
    }
    return null;
  };

  const numU = parse(u);
  const numC = parse(c);

  if (numU !== null && numC !== null) {
    return Math.abs(numU - numC) < 1e-6; 
  }

  return false;
}

export function checkAnswerMathEquivalent(userAnswer: string | undefined | null, correctAnswers: string[], isMath: boolean = true): boolean {
  const u = (userAnswer || '').trim();
  if (correctAnswers.includes(u)) return true;

  if (isMath) {
    return correctAnswers.some(c => isMathAnswerEquivalent(u, c));
  }

  return false;
}
