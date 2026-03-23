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
