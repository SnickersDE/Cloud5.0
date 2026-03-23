import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import type {
  ContentSection,
  FlashcardDeckDeleteInput,
  FlashcardDeckListItem,
  FlashcardDeckSaveInput,
  ModuleDeleteInput,
  ModuleListItem,
  ModuleSaveInput,
  QuizDeleteInput,
  QuizListItem,
  QuizSaveInput,
  FastSearchScope,
  UserFastSearchItem,
} from './content.types';

@Injectable()
export class ContentService {
  constructor(private readonly configService: ConfigService) {}

  private readonly fallbackSections: ContentSection[] = [
    {
      slug: 'zusammenfassungen',
      title: 'Zusammenfassungen',
      subtitle: 'Kompakt auf den Punkt',
      description:
        'Hier stehen später deine Lerninhalte als prägnante Übersicht.',
    },
    {
      slug: 'karteikarten',
      title: 'Karteikarten',
      subtitle: 'Merken mit System',
      description: 'Diese Seite enthält Platzhalter für adaptive Lernkarten.',
    },
    {
      slug: 'quiz',
      title: 'Quiz',
      subtitle: 'Wissen unter Druck',
      description:
        'Dieser Bereich zeigt später Fragen, Zeitmodus und Auswertung.',
    },
    {
      slug: 'chat',
      title: 'Chat',
      subtitle: 'Lernen im Dialog',
      description: 'Hier wird ein Live-Chat mit Lernhilfe und Gruppen folgen.',
    },
    {
      slug: 'gruppen',
      title: 'Gruppen',
      subtitle: 'Gemeinsam stärker',
      description:
        'Diese Platzhalterseite ist für Lerngruppen und Teamräume vorgesehen.',
    },
    {
      slug: 'mein-konto',
      title: 'Mein Konto',
      subtitle: 'Profil und Einstellungen',
      description:
        'Hier kommen später Account, Fortschritt und persönliche Daten hin.',
    },
  ];

  private readonly fallbackModules: ModuleListItem[] = [
    {
      id: 'mod-1',
      name: 'Lineare Algebra Grundlagen',
      uploadedAt: '2026-03-12',
      creator: 'Mia Sommer',
      theme: 'Mathematik',
      intro:
        'Dieses Modul führt in Vektorräume, Matrizen und lineare Abbildungen ein.',
      terms:
        'Vektorraum, Basis, Determinante und Eigenwert werden mit kurzen Beispielen erklärt.',
      focus:
        'Rechnen mit Matrizen, Lösen linearer Gleichungssysteme und geometrische Interpretation.',
    },
    {
      id: 'mod-2',
      name: 'Neuronale Netze kompakt',
      uploadedAt: '2026-03-16',
      creator: 'Jonas Winter',
      theme: 'Machine Learning',
      intro:
        'Das Modul zeigt den Aufbau einfacher Feedforward-Netze und den Lernprozess.',
      terms:
        'Gewichte, Aktivierungsfunktion, Loss-Funktion und Backpropagation sind zentral.',
      focus:
        'Training kleiner Modelle, Overfitting vermeiden und Lernraten sinnvoll wählen.',
    },
    {
      id: 'mod-3',
      name: 'Softwarearchitektur Patterns',
      uploadedAt: '2026-03-20',
      creator: 'Lea Kranz',
      theme: 'Software Engineering',
      intro:
        'Hier bekommst du einen Überblick zu typischen Architekturmustern in Webprojekten.',
      terms:
        'Layered Architecture, Repository, Dependency Injection und Event-Driven Ansätze.',
      focus:
        'Wann welches Pattern sinnvoll ist und wie sich Wartbarkeit langfristig verbessert.',
    },
    {
      id: 'mod-4',
      name: 'Statistik für Data Science',
      uploadedAt: '2026-03-22',
      creator: 'Lina Koch',
      theme: 'Data Science',
      intro: 'Ein kompakter Einstieg in Wahrscheinlichkeiten und Verteilungen.',
      terms: 'Mittelwert, Varianz, Normalverteilung, Konfidenzintervall.',
      focus: 'Hypothesentests und belastbare Interpretation von Datensätzen.',
    },
    {
      id: 'mod-5',
      name: 'Betriebssysteme Essentials',
      uploadedAt: '2026-03-23',
      creator: 'Tom Berger',
      theme: 'Systeme',
      intro: 'Hier lernst du Prozesse, Threads und Scheduling kennen.',
      terms: 'Deadlock, Mutex, Semaphore, Context Switch.',
      focus: 'Nebenläufigkeit und Speicherverwaltung verstehen und anwenden.',
    },
    {
      id: 'mod-6',
      name: 'Compiler Grundlagen',
      uploadedAt: '2026-03-24',
      creator: 'Nina Held',
      theme: 'Compilerbau',
      intro: 'Von Lexer bis Codegenerierung in einem klaren Überblick.',
      terms: 'Token, Parsing, AST, Optimierung.',
      focus: 'Fehlererkennung und Transformation vom Quelltext zum Zielcode.',
    },
    {
      id: 'mod-7',
      name: 'Datenbanken Transaktionen',
      uploadedAt: '2026-03-25',
      creator: 'Jan Eckert',
      theme: 'Datenbanken',
      intro: 'ACID-Eigenschaften und Isolation werden praxisnah erklärt.',
      terms: 'Commit, Rollback, Locking, MVCC.',
      focus: 'Konsistenz und Performance in Multi-User-Szenarien.',
    },
    {
      id: 'mod-8',
      name: 'Web Security Basics',
      uploadedAt: '2026-03-26',
      creator: 'Sara Blum',
      theme: 'Sicherheit',
      intro: 'Die wichtigsten Sicherheitsprinzipien für Web-Anwendungen.',
      terms: 'XSS, CSRF, SQL Injection, CSP.',
      focus: 'Absicherung von Formularen, Sessions und Schnittstellen.',
    },
  ];

  private readonly fallbackFlashcardDecks: FlashcardDeckListItem[] = [
    {
      id: 'deck-1',
      name: 'Algebra Basics',
      creator: 'Mia Sommer',
      topic: 'Mathematik',
      cardCount: 3,
      cards: [
        {
          id: 'deck-1-card-1',
          title: 'Karte 1',
          front: 'Was ist eine Matrix?',
          back: 'Eine rechteckige Anordnung von Zahlen.',
        },
        {
          id: 'deck-1-card-2',
          title: 'Karte 2',
          front: 'Was ist eine Determinante?',
          back: 'Ein Skalarwert, der Eigenschaften einer Matrix beschreibt.',
        },
        {
          id: 'deck-1-card-3',
          title: 'Karte 3',
          front: 'Was ist ein Eigenwert?',
          back: 'Ein Faktor, um den ein Eigenvektor skaliert wird.',
        },
      ],
    },
    {
      id: 'deck-2',
      name: 'Netzwerke Einführung',
      creator: 'Jonas Winter',
      topic: 'Informatik',
      cardCount: 2,
      cards: [
        {
          id: 'deck-2-card-1',
          title: 'Karte 1',
          front: 'Wofür steht TCP?',
          back: 'Transmission Control Protocol.',
        },
        {
          id: 'deck-2-card-2',
          title: 'Karte 2',
          front: 'Wofür steht DNS?',
          back: 'Domain Name System.',
        },
      ],
    },
  ];

  private readonly fallbackQuizzes: QuizListItem[] = [
    {
      id: 'quiz-1',
      title: 'Lineare Algebra Check',
      description: 'Prüft Grundlagen zu Matrizen, Vektoren und Eigenwerten.',
      moduleId: 'mod-1',
      difficulty: 'Grundlagen',
      timeLimitSeconds: 600,
      questions: [
        {
          id: 'quiz-1-q-1',
          question: 'Was beschreibt die Determinante einer Matrix?',
          options: [
            'Eine Zeile',
            'Eine Eigenschaft der Matrix',
            'Nur die Dimension',
            'Eine Zufallszahl',
          ],
          correctAnswer: [1],
          feedback:
            'Die Determinante ist ein Skalarwert mit Matrixeigenschaften.',
          type: 'multiple_choice',
        },
      ],
    },
    {
      id: 'quiz-2',
      title: 'Neuronale Netze Training',
      description: 'Backpropagation, Loss und Lernrate im Schnellcheck.',
      moduleId: 'mod-2',
      difficulty: 'Vertiefung',
      timeLimitSeconds: null,
      questions: [
        {
          id: 'quiz-2-q-1',
          question: 'Wofür wird Backpropagation genutzt?',
          options: [
            'Zum Laden von Daten',
            'Zum Berechnen von Gradienten',
            'Zum Rendern von UI',
            'Zum Speichern von Dateien',
          ],
          correctAnswer: [1],
          feedback: 'Backpropagation berechnet Gradienten für das Training.',
          type: 'multiple_choice',
        },
      ],
    },
  ];

  private createSupabaseClient(): SupabaseClient | null {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }

  private createSupabaseServiceClient(): SupabaseClient | null {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !serviceKey) {
      return null;
    }

    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async getSections(): Promise<ContentSection[]> {
    const client = this.createSupabaseClient();
    const tableName =
      this.configService.get<string>('SUPABASE_PLACEHOLDER_TABLE') ??
      'placeholders';

    if (!client) {
      return this.fallbackSections;
    }

    const { data, error } = await client
      .from(tableName)
      .select('slug, title, subtitle, description')
      .order('id', { ascending: true });

    if (error || !data?.length) {
      return this.fallbackSections;
    }

    return data
      .map((item) => {
        const record = item as Record<string, unknown>;
        const slug = typeof record.slug === 'string' ? record.slug : '';
        const title = typeof record.title === 'string' ? record.title : '';
        const subtitle =
          typeof record.subtitle === 'string' ? record.subtitle : '';
        const description =
          typeof record.description === 'string' ? record.description : '';

        return {
          slug,
          title,
          subtitle,
          description,
        };
      })
      .filter((item) => item.slug.length > 0);
  }

  async getConnectionStatus() {
    const client = this.createSupabaseClient();
    const tableName =
      this.configService.get<string>('SUPABASE_PLACEHOLDER_TABLE') ??
      'placeholders';

    if (!client) {
      return {
        provider: 'supabase',
        connected: false,
        source: 'fallback',
      };
    }

    const { error } = await client.from(tableName).select('slug').limit(1);

    return {
      provider: 'supabase',
      connected: !error,
      source: error ? 'fallback' : 'database',
    };
  }

  async getModules(limit: number, offset: number): Promise<ModuleListItem[]> {
    const tableName =
      this.configService.get<string>('SUPABASE_MODULES_TABLE') ?? 'modules';
    const client = this.createSupabaseServiceClient();

    if (!client) {
      return this.fallbackModules.slice(offset, offset + limit);
    }

    const { data, error } = await client
      .from(tableName)
      .select(
        'module_id, name, uploaded_at, creator, theme, intro, terms, focus',
      )
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data?.length) {
      return this.fallbackModules.slice(offset, offset + limit);
    }

    return data
      .map((item) => {
        const record = item as Record<string, unknown>;
        const id = typeof record.module_id === 'string' ? record.module_id : '';
        const name = typeof record.name === 'string' ? record.name : '';
        const uploadedAt =
          typeof record.uploaded_at === 'string' ? record.uploaded_at : '';
        const creator =
          typeof record.creator === 'string' ? record.creator : '';
        const theme = typeof record.theme === 'string' ? record.theme : '';
        const intro = typeof record.intro === 'string' ? record.intro : '';
        const terms = typeof record.terms === 'string' ? record.terms : '';
        const focus = typeof record.focus === 'string' ? record.focus : '';

        return {
          id,
          name,
          uploadedAt,
          creator,
          theme,
          intro,
          terms,
          focus,
        };
      })
      .filter((moduleItem) => moduleItem.id.length > 0);
  }

  async getUserFastSearches(
    userId: string,
    scope: FastSearchScope,
  ): Promise<UserFastSearchItem[]> {
    const client = this.createSupabaseServiceClient();
    if (!client || !userId) {
      return [];
    }

    const { data, error } = await client
      .from('user_fast_searches')
      .select('fast_search_id, label')
      .eq('user_id', userId)
      .eq('scope', scope)
      .order('created_at', { ascending: true });

    if (error || !data?.length) {
      return [];
    }

    return data.map((item) => {
      const record = item as Record<string, unknown>;
      const id =
        typeof record.fast_search_id === 'string' ? record.fast_search_id : '';
      const label = typeof record.label === 'string' ? record.label : '';
      return { id, label };
    });
  }

  async saveUserFastSearch(
    userId: string,
    label: string,
    scope: FastSearchScope,
  ) {
    const client = this.createSupabaseServiceClient();
    if (!client || !userId || !label.trim()) {
      return { saved: false };
    }

    const existing = await client
      .from('user_fast_searches')
      .select('fast_search_id')
      .eq('user_id', userId)
      .eq('scope', scope)
      .eq('label', label.trim())
      .maybeSingle();

    if (existing.data) {
      return { saved: true };
    }

    const { error } = await client.from('user_fast_searches').insert({
      user_id: userId,
      scope,
      label: label.trim(),
    });

    if (error) {
      return { saved: false, message: error.message };
    }
    return { saved: true };
  }

  async saveModuleDraft(body: ModuleSaveInput) {
    const moduleId = body.moduleId?.trim();
    const name = body.name?.trim();

    if (!moduleId || !name) {
      return {
        saved: false,
        source: 'validation',
        message: 'moduleId und name sind erforderlich.',
      };
    }

    const client = this.createSupabaseServiceClient();
    if (!client) {
      return {
        saved: false,
        source: 'local',
        message: 'SUPABASE_SERVICE_ROLE_KEY fehlt.',
      };
    }

    const tableName =
      this.configService.get<string>('SUPABASE_MODULES_TABLE') ?? 'modules';

    const payload = {
      module_id: moduleId,
      name,
      theme: body.theme ?? '',
      intro: body.intro ?? '',
      terms: body.terms ?? '',
      focus: body.focus ?? '',
      uploaded_at: body.uploadedAt ?? '',
      creator: body.creator ?? '',
      mode: body.mode ?? 'manual',
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from(tableName)
      .upsert(payload, { onConflict: 'module_id' });

    if (error) {
      return {
        saved: false,
        source: 'supabase',
        message: error.message,
      };
    }

    return {
      saved: true,
      source: 'supabase',
      message: 'Modul erfolgreich gespeichert.',
    };
  }

  async deleteModule(body: ModuleDeleteInput) {
    const moduleId = body.moduleId?.trim();
    const requester = body.requester?.trim();
    const isAdmin = Boolean(body.isAdmin);
    const tableName =
      this.configService.get<string>('SUPABASE_MODULES_TABLE') ?? 'modules';
    const client = this.createSupabaseServiceClient();

    if (!moduleId || !requester) {
      return {
        deleted: false,
        source: 'validation',
        message: 'moduleId und requester sind erforderlich.',
      };
    }

    if (!client) {
      return {
        deleted: false,
        source: 'local',
        message: 'SUPABASE_SERVICE_ROLE_KEY fehlt.',
      };
    }

    const { data, error } = await client
      .from(tableName)
      .select('module_id, creator')
      .eq('module_id', moduleId)
      .maybeSingle();

    if (error || !data) {
      return {
        deleted: false,
        source: 'supabase',
        message: error?.message ?? 'Modul nicht gefunden.',
      };
    }

    const creator =
      typeof (data as Record<string, unknown>).creator === 'string'
        ? ((data as Record<string, unknown>).creator as string)
        : '';

    if (!isAdmin && creator.trim().toLowerCase() !== requester.toLowerCase()) {
      return {
        deleted: false,
        source: 'policy',
        message: 'Nur Ersteller oder Admin dürfen löschen.',
      };
    }

    const { error: deleteError } = await client
      .from(tableName)
      .delete()
      .eq('module_id', moduleId);

    if (deleteError) {
      return {
        deleted: false,
        source: 'supabase',
        message: deleteError.message,
      };
    }

    return {
      deleted: true,
      source: 'supabase',
      message: 'Modul gelöscht.',
    };
  }

  async getFlashcardDecks(
    limit: number,
    offset: number,
  ): Promise<FlashcardDeckListItem[]> {
    const deckTable =
      this.configService.get<string>('SUPABASE_FLASHCARD_DECKS_TABLE') ??
      'flashcard_decks';
    const cardTable =
      this.configService.get<string>('SUPABASE_FLASHCARD_CARDS_TABLE') ??
      'flashcard_cards';
    const client = this.createSupabaseServiceClient();

    if (!client) {
      return this.fallbackFlashcardDecks.slice(offset, offset + limit);
    }

    const { data: deckData, error: deckError } = await client
      .from(deckTable)
      .select('deck_id, name, creator, topic')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (deckError || !deckData?.length) {
      return this.fallbackFlashcardDecks.slice(offset, offset + limit);
    }

    const deckIds = deckData
      .map((item) => {
        const record = item as Record<string, unknown>;
        return typeof record.deck_id === 'string' ? record.deck_id : '';
      })
      .filter((value) => value.length > 0);

    const cardsByDeck = new Map<
      string,
      {
        id: string;
        title: string;
        front: string;
        back: string;
      }[]
    >();

    if (deckIds.length > 0) {
      const { data: cardData } = await client
        .from(cardTable)
        .select('card_id, deck_id, card_title, front, back, position')
        .in('deck_id', deckIds)
        .order('position', { ascending: true });

      if (cardData?.length) {
        cardData.forEach((item) => {
          const record = item as Record<string, unknown>;
          const deckId =
            typeof record.deck_id === 'string' ? record.deck_id : '';
          const cardId =
            typeof record.card_id === 'string'
              ? record.card_id
              : `${deckId}-${Math.random().toString(36).slice(2, 9)}`;
          const front = typeof record.front === 'string' ? record.front : '';
          const back = typeof record.back === 'string' ? record.back : '';
          const title =
            typeof record.card_title === 'string' &&
            record.card_title.length > 0
              ? record.card_title
              : `Karte ${(cardsByDeck.get(deckId)?.length ?? 0) + 1}`;
          const current = cardsByDeck.get(deckId) ?? [];
          current.push({ id: cardId, title, front, back });
          cardsByDeck.set(deckId, current);
        });
      }
    }

    return deckData
      .map((item) => {
        const record = item as Record<string, unknown>;
        const id = typeof record.deck_id === 'string' ? record.deck_id : '';
        const name = typeof record.name === 'string' ? record.name : '';
        const creator =
          typeof record.creator === 'string' ? record.creator : 'Unbekannt';
        const topic = typeof record.topic === 'string' ? record.topic : '';
        const cards = cardsByDeck.get(id) ?? [];

        return {
          id,
          name,
          creator,
          topic,
          cardCount: cards.length,
          cards,
        };
      })
      .filter((deck) => deck.id.length > 0 && deck.name.length > 0);
  }

  async saveFlashcardDeck(body: FlashcardDeckSaveInput) {
    const deckTable =
      this.configService.get<string>('SUPABASE_FLASHCARD_DECKS_TABLE') ??
      'flashcard_decks';
    const cardTable =
      this.configService.get<string>('SUPABASE_FLASHCARD_CARDS_TABLE') ??
      'flashcard_cards';
    const client = this.createSupabaseServiceClient();

    if (!client) {
      return {
        saved: false,
        source: 'local',
        message: 'SUPABASE_SERVICE_ROLE_KEY fehlt.',
      };
    }

    const deckId = (body.deckId?.trim() || `deck-${Date.now()}`).slice(0, 80);
    const name = body.name.trim();
    const creator = body.creator.trim();
    const topic = body.topic.trim();
    const cards = Array.isArray(body.cards) ? body.cards : [];

    if (!name || !creator || !topic) {
      return {
        saved: false,
        source: 'validation',
        message: 'Name, Ersteller und Thema sind erforderlich.',
      };
    }

    const normalizedCards = cards
      .map((card, index) => ({
        card_id: card.id?.trim() || `${deckId}-card-${index + 1}-${Date.now()}`,
        deck_id: deckId,
        card_title: card.title?.trim() || `Karte ${index + 1}`,
        front: card.front?.trim() ?? '',
        back: card.back?.trim() ?? '',
        position: index,
        updated_at: new Date().toISOString(),
      }))
      .filter((card) => card.front.length > 0 && card.back.length > 0);

    const { error: deckError } = await client.from(deckTable).upsert(
      {
        deck_id: deckId,
        name,
        creator,
        topic,
        card_count: normalizedCards.length,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'deck_id' },
    );

    if (deckError) {
      return {
        saved: false,
        source: 'supabase',
        message: deckError.message,
      };
    }

    const { error: deleteError } = await client
      .from(cardTable)
      .delete()
      .eq('deck_id', deckId);

    if (deleteError) {
      return {
        saved: false,
        source: 'supabase',
        message: deleteError.message,
      };
    }

    if (normalizedCards.length > 0) {
      const { error: cardError } = await client
        .from(cardTable)
        .insert(normalizedCards);

      if (cardError) {
        return {
          saved: false,
          source: 'supabase',
          message: cardError.message,
        };
      }
    }

    return {
      saved: true,
      source: 'supabase',
      deckId,
      cardCount: normalizedCards.length,
      message: 'Deck erfolgreich gespeichert.',
    };
  }

  async deleteFlashcardDeck(body: FlashcardDeckDeleteInput) {
    const deckId = body.deckId?.trim();
    const requester = body.requester?.trim();
    const isAdmin = Boolean(body.isAdmin);
    const deckTable =
      this.configService.get<string>('SUPABASE_FLASHCARD_DECKS_TABLE') ??
      'flashcard_decks';
    const client = this.createSupabaseServiceClient();

    if (!deckId || !requester) {
      return {
        deleted: false,
        source: 'validation',
        message: 'deckId und requester sind erforderlich.',
      };
    }

    if (!client) {
      return {
        deleted: false,
        source: 'local',
        message: 'SUPABASE_SERVICE_ROLE_KEY fehlt.',
      };
    }

    const { data, error } = await client
      .from(deckTable)
      .select('deck_id, creator')
      .eq('deck_id', deckId)
      .maybeSingle();

    if (error || !data) {
      return {
        deleted: false,
        source: 'supabase',
        message: error?.message ?? 'Deck nicht gefunden.',
      };
    }

    const creator =
      typeof (data as Record<string, unknown>).creator === 'string'
        ? ((data as Record<string, unknown>).creator as string)
        : '';

    if (!isAdmin && creator.trim().toLowerCase() !== requester.toLowerCase()) {
      return {
        deleted: false,
        source: 'policy',
        message: 'Nur Ersteller oder Admin dürfen löschen.',
      };
    }

    const { error: deleteError } = await client
      .from(deckTable)
      .delete()
      .eq('deck_id', deckId);

    if (deleteError) {
      return {
        deleted: false,
        source: 'supabase',
        message: deleteError.message,
      };
    }

    return {
      deleted: true,
      source: 'supabase',
      message: 'Deck gelöscht.',
    };
  }

  async getQuizzes(limit: number, offset: number): Promise<QuizListItem[]> {
    const quizTable =
      this.configService.get<string>('SUPABASE_QUIZZES_TABLE') ?? 'quizzes';
    const questionTable =
      this.configService.get<string>('SUPABASE_QUIZ_QUESTIONS_TABLE') ??
      'quiz_questions';
    const client = this.createSupabaseServiceClient();

    if (!client) {
      return this.fallbackQuizzes.slice(offset, offset + limit);
    }

    const { data: quizData, error: quizError } = await client
      .from(quizTable)
      .select(
        'quiz_id, title, description, module_id, difficulty, time_limit_seconds',
      )
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (quizError || !quizData?.length) {
      return this.fallbackQuizzes.slice(offset, offset + limit);
    }

    const quizIds = quizData
      .map((item) => {
        const record = item as Record<string, unknown>;
        return typeof record.quiz_id === 'string' ? record.quiz_id : '';
      })
      .filter((value) => value.length > 0);

    const questionsByQuiz = new Map<
      QuizListItem['id'],
      QuizListItem['questions']
    >();

    if (quizIds.length > 0) {
      const { data: questionData } = await client
        .from(questionTable)
        .select(
          'question_id, quiz_id, question_type, question, options, correct_answer, feedback, position',
        )
        .in('quiz_id', quizIds)
        .order('position', { ascending: true });

      if (questionData?.length) {
        questionData.forEach((item) => {
          const record = item as Record<string, unknown>;
          const quizId =
            typeof record.quiz_id === 'string' ? record.quiz_id : '';
          const questionId =
            typeof record.question_id === 'string'
              ? record.question_id
              : `${quizId}-${Date.now()}`;
          const question =
            typeof record.question === 'string' ? record.question : '';
          const options = Array.isArray(record.options)
            ? record.options.filter(
                (entry): entry is string => typeof entry === 'string',
              )
            : [];
          const correctAnswer = Array.isArray(record.correct_answer)
            ? record.correct_answer.filter(
                (entry): entry is number => typeof entry === 'number',
              )
            : [];
          const feedback =
            typeof record.feedback === 'string' ? record.feedback : '';
          const type =
            record.question_type === 'single_choice' ||
            record.question_type === 'short_answer'
              ? record.question_type
              : 'multiple_choice';
          const current = questionsByQuiz.get(quizId) ?? [];
          current.push({
            id: questionId,
            question,
            options,
            correctAnswer,
            feedback,
            type,
          });
          questionsByQuiz.set(quizId, current);
        });
      }
    }

    return quizData
      .map((item) => {
        const record = item as Record<string, unknown>;
        const id = typeof record.quiz_id === 'string' ? record.quiz_id : '';
        const title = typeof record.title === 'string' ? record.title : '';
        const description =
          typeof record.description === 'string' ? record.description : '';
        const moduleId =
          typeof record.module_id === 'string' ? record.module_id : '';
        const difficulty: QuizListItem['difficulty'] =
          record.difficulty === 'Vertiefung' ||
          record.difficulty === 'Prüfungsvorbereitung'
            ? record.difficulty
            : 'Grundlagen';
        const timeLimitSeconds =
          typeof record.time_limit_seconds === 'number'
            ? record.time_limit_seconds
            : null;
        const questions = questionsByQuiz.get(id) ?? [];
        return {
          id,
          title,
          description,
          moduleId,
          difficulty,
          timeLimitSeconds,
          questions,
        };
      })
      .filter(
        (quizItem) => quizItem.id.length > 0 && quizItem.title.length > 0,
      );
  }

  async saveQuiz(body: QuizSaveInput) {
    const quizTable =
      this.configService.get<string>('SUPABASE_QUIZZES_TABLE') ?? 'quizzes';
    const questionTable =
      this.configService.get<string>('SUPABASE_QUIZ_QUESTIONS_TABLE') ??
      'quiz_questions';
    const client = this.createSupabaseServiceClient();

    if (!client) {
      return {
        saved: false,
        source: 'local',
        message: 'SUPABASE_SERVICE_ROLE_KEY fehlt.',
      };
    }

    const quizId = (body.quizId?.trim() || `quiz-${Date.now()}`).slice(0, 90);
    const title = body.title?.trim();
    if (!title) {
      return {
        saved: false,
        source: 'validation',
        message: 'Titel ist erforderlich.',
      };
    }

    const questions = Array.isArray(body.questions) ? body.questions : [];

    const { error: quizError } = await client.from(quizTable).upsert(
      {
        quiz_id: quizId,
        title,
        description: body.description?.trim() ?? '',
        module_id: body.moduleId?.trim() ?? '',
        difficulty: body.difficulty ?? 'Grundlagen',
        time_limit_seconds:
          typeof body.timeLimitSeconds === 'number'
            ? body.timeLimitSeconds
            : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'quiz_id' },
    );

    if (quizError) {
      return {
        saved: false,
        source: 'supabase',
        message: quizError.message,
      };
    }

    const { error: deleteError } = await client
      .from(questionTable)
      .delete()
      .eq('quiz_id', quizId);

    if (deleteError) {
      return {
        saved: false,
        source: 'supabase',
        message: deleteError.message,
      };
    }

    if (questions.length > 0) {
      const normalizedQuestions = questions
        .map((question, index) => ({
          question_id:
            question.id?.trim() || `${quizId}-q-${index + 1}-${Date.now()}`,
          quiz_id: quizId,
          question_type: question.type ?? 'multiple_choice',
          question: question.question?.trim() ?? '',
          options: Array.isArray(question.options) ? question.options : [],
          correct_answer: Array.isArray(question.correctAnswer)
            ? question.correctAnswer
            : [],
          feedback: question.feedback?.trim() ?? '',
          position: index,
          updated_at: new Date().toISOString(),
        }))
        .filter((entry) => entry.question.length > 0);

      if (normalizedQuestions.length > 0) {
        const { error: questionError } = await client
          .from(questionTable)
          .insert(normalizedQuestions);

        if (questionError) {
          return {
            saved: false,
            source: 'supabase',
            message: questionError.message,
          };
        }
      }
    }

    return {
      saved: true,
      source: 'supabase',
      quizId,
      message: 'Quiz erfolgreich gespeichert.',
    };
  }

  async deleteQuiz(body: QuizDeleteInput) {
    const quizId = body.quizId?.trim();
    const requester = body.requester?.trim();
    const isAdmin = Boolean(body.isAdmin);
    const quizTable =
      this.configService.get<string>('SUPABASE_QUIZZES_TABLE') ?? 'quizzes';
    const client = this.createSupabaseServiceClient();

    if (!quizId || !requester) {
      return {
        deleted: false,
        source: 'validation',
        message: 'quizId und requester sind erforderlich.',
      };
    }

    if (!client) {
      return {
        deleted: false,
        source: 'local',
        message: 'SUPABASE_SERVICE_ROLE_KEY fehlt.',
      };
    }

    const { data, error } = await client
      .from(quizTable)
      .select('quiz_id, created_by')
      .eq('quiz_id', quizId)
      .maybeSingle();

    if (error || !data) {
      return {
        deleted: false,
        source: 'supabase',
        message: error?.message ?? 'Quiz nicht gefunden.',
      };
    }

    const createdBy =
      typeof (data as Record<string, unknown>).created_by === 'string'
        ? ((data as Record<string, unknown>).created_by as string)
        : '';

    if (
      !isAdmin &&
      createdBy.trim().toLowerCase() !== requester.toLowerCase()
    ) {
      return {
        deleted: false,
        source: 'policy',
        message: 'Nur Ersteller oder Admin dürfen löschen.',
      };
    }

    const { error: deleteError } = await client
      .from(quizTable)
      .delete()
      .eq('quiz_id', quizId);

    if (deleteError) {
      return {
        deleted: false,
        source: 'supabase',
        message: deleteError.message,
      };
    }

    return {
      deleted: true,
      source: 'supabase',
      message: 'Quiz gelöscht.',
    };
  }
}
