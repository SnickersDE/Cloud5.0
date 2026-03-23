export type ContentSection = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
};

export type ModuleSaveInput = {
  moduleId: string;
  name: string;
  theme: string;
  intro: string;
  terms: string;
  focus: string;
  uploadedAt: string;
  creator: string;
  mode?: 'manual' | 'auto';
};

export type ModuleListItem = {
  id: string;
  name: string;
  uploadedAt: string;
  creator: string;
  theme: string;
  intro: string;
  terms: string;
  focus: string;
};

export type FlashcardCardInput = {
  id?: string;
  title?: string;
  front: string;
  back: string;
};

export type FlashcardDeckSaveInput = {
  deckId?: string;
  name: string;
  creator: string;
  topic: string;
  cards: FlashcardCardInput[];
};

export type FlashcardDeckListItem = {
  id: string;
  name: string;
  creator: string;
  topic: string;
  cardCount: number;
  cards: {
    id: string;
    title: string;
    front: string;
    back: string;
  }[];
};

export type ModuleDeleteInput = {
  moduleId: string;
  requester: string;
  isAdmin?: boolean;
};

export type FlashcardDeckDeleteInput = {
  deckId: string;
  requester: string;
  isAdmin?: boolean;
};

export type QuizQuestionInput = {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number[];
  feedback?: string;
  type?: 'multiple_choice' | 'single_choice' | 'short_answer';
};

export type QuizSaveInput = {
  quizId?: string;
  title: string;
  description: string;
  moduleId?: string;
  difficulty: 'Grundlagen' | 'Vertiefung' | 'Prüfungsvorbereitung';
  timeLimitSeconds?: number | null;
  questions: QuizQuestionInput[];
};

export type QuizListItem = {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  difficulty: 'Grundlagen' | 'Vertiefung' | 'Prüfungsvorbereitung';
  timeLimitSeconds: number | null;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number[];
    feedback: string;
    type: 'multiple_choice' | 'single_choice' | 'short_answer';
  }[];
};

export type QuizDeleteInput = {
  quizId: string;
  requester: string;
  isAdmin?: boolean;
};

export type UserFastSearchItem = {
  id: string;
  label: string;
};

export type FastSearchScope = 'summaries' | 'flashcards';
