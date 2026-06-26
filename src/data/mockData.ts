import { Module, Question, Passage, VocabularyWord, StudentRank } from '../types';

export const INITIAL_MODULES: Module[] = [
  {
    id: 'rw1',
    title: 'Reading & Writing Module 1',
    subject: 'Reading & Writing',
    moduleNum: 1,
    questionsCount: 27,
    durationMinutes: 32,
    status: 'Attempted',
    score: 680,
  },
  {
    id: 'rw2',
    title: 'Reading & Writing Module 2',
    subject: 'Reading & Writing',
    moduleNum: 2,
    questionsCount: 27,
    durationMinutes: 32,
    status: 'Not Started',
  },
  {
    id: 'm1',
    title: 'Math Module 1',
    subject: 'Math',
    moduleNum: 1,
    questionsCount: 22,
    durationMinutes: 35,
    status: 'Not Started',
  },
  {
    id: 'm2',
    title: 'Math Module 2',
    subject: 'Math',
    moduleNum: 2,
    questionsCount: 22,
    durationMinutes: 35,
    status: 'Not Started',
  }
];

export const SAT_PASSAGE: Passage = {
  title: 'Reading Comprehension',
  introduction: 'This passage is adapted from a discussion on modern urban infrastructure and its psychological impacts on residents.',
  paragraphs: [
    'The architecture of the twenty-first century city is defined less by monumental structures than by the invisible networks that sustain it. While towering skyscrapers command the skyline, the true essence of urban functionality lies buried beneath the pavement or suspended in the electromagnetic spectrum. It is a system designed for efficiency, prioritizing rapid transit of data and matter over the aesthetic cohesion that once characterized civic planning.',
    'In this environment, the citizen is continually subjected to a barrage of sensory input. Digital displays are ubiquitous, vying for attention in every public square and transit hub. The psychological toll of this constant stimulation is a subject of growing concern among urban sociologists, who argue that the mind requires respite from the relentless demand for engagement.',
    'Yet, there is a paradox inherent in this modern condition. Even as individuals report feeling overwhelmed by the urban sensory landscape, they exhibit a profound reliance on the very technologies that generate it. To disconnect is to risk isolation, not merely socially, but economically and practically. The infrastructure has become an extension of the self, indispensable for navigating the complexities of daily life.',
    'Therefore, the challenge for future urban design is not to dismantle these networks, but to harmonize them with human cognitive limits. Planners must conceive of spaces that integrate connectivity seamlessly, without allowing it to dominate the visual and auditory environment. Only then can the city fulfill its promise as a catalyst for human flourishing rather than an engine of sensory exhaustion.'
  ]
};

export const RW1_QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'According to the first paragraph, the "true essence" of modern urban functionality is primarily associated with which of the following?',
    question_type: 'mcq',
    options: {
      A: 'monumental structures that define the cityscape.',
      B: 'aesthetic cohesion mirroring traditional civic planning.',
      C: 'underground utility systems and electromagnetic networks.',
      D: 'towering skyscrapers that dominate the aesthetic skyline.'
    },
    correctAnswer: ['C']
  },
  {
    id: 2,
    text: 'Which choice best describes the central paradox outlined in the third paragraph?',
    question_type: 'mcq',
    options: {
      A: 'People feel overwhelmed by urban systems but are incapable of functioning without them.',
      B: 'Cities grow increasingly crowded yet urban residents report feeling lonelier.',
      C: 'Modern technology connects individuals globally while isolating them locally.',
      D: 'Environmental planners attempt to reduce sensory stimulation while increasing digital screens.'
    },
    correctAnswer: ['A']
  },
  {
    id: 3,
    text: 'Based on the passage, future urban planners must prioritize which design goal?',
    question_type: 'mcq',
    options: {
      A: 'Complete dismantling of high-speed digital arrays to protect nature.',
      B: 'Balancing digital connectivity with human cognitive thresholds.',
      C: 'Creating larger, more visually dramatic skyscrapers.',
      D: 'Replacing rapid transit with traditional forms of civic gathering.'
    },
    correctAnswer: ['B']
  },
  {
    id: 4,
    text: 'As used in the second paragraph, the word "ubiquitous" most nearly means:',
    question_type: 'mcq',
    options: {
      A: 'occasionally disruptive.',
      B: 'present everywhere.',
      C: 'visually appealing.',
      D: 'technologically advanced.'
    },
    correctAnswer: ['B']
  },
  {
    id: 5,
    text: 'What primary tone is established by the author in discussing modern urban sensory stimulation?',
    question_type: 'mcq',
    options: {
      A: 'Apathetic indifference toward societal changes.',
      B: 'Unchecked enthusiasm for tech-smart cities.',
      C: 'Objective concern regarding psychological impacts.',
      D: 'Disdainful contempt for architectural aesthetic.'
    },
    correctAnswer: ['C']
  }
];

export const MATH_QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'If f(x) = 3x - 7 and f(k) = 8, what is the value of k?',
    question_type: 'mcq',
    options: {
      A: '3',
      B: '5',
      C: '7',
      D: '15'
    },
    correctAnswer: ['B']
  },
  {
    id: 2,
    text: 'A certain line in the xy-plane passes through (2, 5) and has a slope of -2. What is the y-intercept of this line?',
    question_type: 'mcq',
    options: {
      A: '1',
      B: '5',
      C: '9',
      D: '11'
    },
    correctAnswer: ['C']
  },
  {
    id: 3,
    text: 'If x^2 - 6x + 9 = 0, what is the value of (x - 3)^3?',
    question_type: 'mcq',
    options: {
      A: '-27',
      B: '0',
      C: '9',
      D: '27'
    },
    correctAnswer: ['B']
  },
  {
    id: 4,
    text: 'The dynamic solution to the equation system ax + by = 12 and 2ax - by = 6, given that x = 2 and y = 4, implies what value for the coefficient coefficient a?',
    question_type: 'mcq',
    options: {
      A: '3',
      B: '4',
      C: '5',
      D: '8'
    },
    correctAnswer: ['A']
  }
];

export const INITIAL_VOCABULARY: VocabularyWord[] = [
  {
    id: 'v1',
    term: 'Ubiquitous',
    type: 'Adjective',
    definition: 'Present, appearing, or found everywhere.',
    example: 'His ubiquitous influence was felt by all the family.',
    date: 'Oct 12, 2025',
    status: 'Mastered'
  },
  {
    id: 'v2',
    term: 'Ephemeral',
    type: 'Adjective',
    definition: 'Lasting for a very short time.',
    example: 'Fashions are ephemeral and trend-driven.',
    date: 'Oct 10, 2025',
    status: 'Learning'
  },
  {
    id: 'v3',
    term: 'Sycophant',
    type: 'Noun',
    definition: 'A person who acts obsequiously toward someone important in order to gain advantage.',
    example: 'The king was surrounded by sycophants who agreed with his every word.',
    date: 'Oct 08, 2025',
    status: 'Learning'
  },
  {
    id: 'v4',
    term: 'Cacophony',
    type: 'Noun',
    definition: 'A harsh, discordant mixture of sounds.',
    example: 'A cacophony of deafening alarm bells woke him.',
    date: 'Oct 05, 2025',
    status: 'Mastered'
  }
];

export const STUDENT_RANKINGS: StudentRank[] = [
  {
    rank: 1,
    name: 'M. Davis',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcm48maOyiqpFE1N8A4EgqLWNQ_kXciViVjn6MjET5BEZVOUCSy2hpsee4BsuNATf3JAJr6ZThkRTcDkwG8CMLX2yHecHekWEoDfAWp61KiHsFFAmhv9ojtaoA7T5Hxwtl5G5X_7uRrBOFn7nhiCrhkiPKrZaxB6K5V8J4GEyAnSqkDoafcjFX3pHG2bEYw5OpzfUnpNW0ATxVkzp8UWY-5fGDym3FocXg3EhhPY5xjOVD0SZEHE6W02wgKOWPlbY2gFR9zmyP7Vo',
    totalScore: 1580,
    testsCompleted: 15,
    avgScore: 158.0
  },
  {
    rank: 2,
    name: 'E. Chen',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1HtF2MrGB-NVYP2m_aHZEv9Q9wTDzRIyzd8s3DyuAc5hU_xHpiIP6A9k9J4_b3Ghzwhn8rJefRxfFKmMcQbmuRV8TAovzKjglvRwgNYND8vOT5yhNF3Ek0L5vbgvcTduwUgseaA1uDSQYmpSimaDwAT7fU60p9CVInRZe7NdYlKzgmkWBF2S017Ac6iUHoCRLnlM81pk_p3Qg4gLEgN0xo0vxuczWTXuv154xuibmgId1z65hTsDakhB_5F3GN5Pjw0XuIRud8w8',
    totalScore: 1540,
    testsCompleted: 12,
    avgScore: 128.3
  },
  {
    rank: 3,
    name: 'A. Patel',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyTYVbC8s1NER9NTjMEKqNmzUR5hvjUn7eXijI1JEuk4xoZQHOWPAtOea25Um_UTb2eGAhWHEaYy-oq2aZ-O9ne1aiqUHbEuy681Bc2eHZaZECZGfh3azpvI0l7U8SLIKCyq-7S8fFFrojdm27u8SV9WQNtRBgKK7PMhNClQDhXDz_zgLIkwp1NYISsDgLiNWZmqfYstqnfHXzvh5T-OUjvdomuXDu92N_R4FK5ZERQTYtNw4Qg9F7gL0y1o-B30IORAkEi6hWysk',
    totalScore: 1520,
    testsCompleted: 14,
    avgScore: 108.5
  },
  {
    rank: 4,
    name: 'J. Smith',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKMFLWyYfRtIQaagsXpItU9hmqWLPoEzqg3Yr_Ley4hIR7jiWtTeqfKwzP1iLZvzOgrs3mqTXJvFWSgOq_KcoU7Ve0hhSknG571CK98OMEP-voCXxJLE1JWdJYgYCvYiswJ7Xe9LEWSUF-UPLRjLzyXkevmnm5XvasbpGlhLuOnprgzYCOuEk6SpTPOIQWHwHlkK0jZvSjwfJMNvGZnbInNrb-kEIPwwoqINGHSAZGquGq782dg6uh08eAH6Jwjr5U_iA-tf5HABU',
    totalScore: 1500,
    testsCompleted: 12,
    avgScore: 125.0
  },
  {
    rank: 5,
    name: 'S. Williams',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    totalScore: 1480,
    testsCompleted: 15,
    avgScore: 98.6
  },
  {
    rank: 12,
    name: 'You (L. Garcia)',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLEryZ9kwBtqN2I7R61KGfcElyDcesnwdZgezNI-oODn1KaN4iFWvLY5u5YgbwthXh_hxPKypTjlV9z3sGzhJwSDKJm7BqADupXzgHKcNb-SaP2I4ME7hvdU-9JEnLzt--I8ZLsY4VuRxoa_pFInGmN9o9eEKi46XjDINyOT2d5NvrKbPA2UwNB4iiBst8WYKdOlP_8bPARkHGN8_iz3atlT-2JxB-NHwycCqbcktys_bWLfCEOvEGM77ksq8u5rcDnNv3E4U5IqM',
    totalScore: 1350,
    testsCompleted: 10,
    avgScore: 135.0,
    isCurrentUser: true,
  },
  {
    rank: 25,
    name: 'K. Lee',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    totalScore: 1200,
    testsCompleted: 8,
    avgScore: 150.0
  }
];
