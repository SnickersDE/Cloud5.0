import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import entranceIcon from './assets/login.png'
import RealmBuilderV5 from './games/RealmBuilderV5.jsx'
import TypingArenaPreview from './games/TypingArenaPreview.jsx'
import './App.css'

type Page = {
  slug: string
  label: string
  highlight: string
  fallbackText: string
}

type Section = {
  slug: string
  title: string
  subtitle: string
  description: string
}

type ModuleSummary = {
  id: string
  name: string
  uploadedAt: string
  creator: string
  theme: string
  intro: string
  terms: string
  focus: string
}

type ModulePdf = {
  id: string
  fileName: string
  uploadedAt: string
  uploader: string
}

type ModuleApiItem = {
  id: string
  name: string
  uploadedAt: string
  creator: string
  theme: string
  intro: string
  terms: string
  focus: string
}

type FlashcardCard = {
  id: string
  front: string
  back: string
}

type FlashcardDeck = {
  id: string
  name: string
  creator: string
  topic: string
  cardCount: number
  cards: FlashcardCard[]
}

type GameEntry = {
  id: string
  title: string
  location: string
  icon: string
  mode: 'iframe' | 'component'
}

type NavigationEntry = {
  to: string
  icon: string
  label: string
}

type NavigationGroup = {
  label: string
  entries: NavigationEntry[]
}

const dropdownGroups: NavigationGroup[] = [
  {
    label: 'Funktionen',
    entries: [
      { to: '/zusammenfassungen', icon: '🧾', label: 'Zusammenfassungen' },
      { to: '/karteikarten', icon: '🗂️', label: 'Karteikarten' },
      { to: '/quiz', icon: '❓', label: 'Quiz' },
    ],
  },
  {
    label: 'Spiele',
    entries: [
      { to: '/spiele/pulse', icon: '🫀', label: 'Pulse Game' },
      { to: '/spiele/realm-builder', icon: '🏰', label: 'RealmBuilder V5' },
      { to: '/spiele/typing-arena', icon: '⌨️', label: 'Typing Arena Preview' },
    ],
  },
  {
    label: 'Kontoverwaltung',
    entries: [
      { to: '/mein-konto/anmelden', icon: '🔐', label: 'Anmelden' },
      { to: '/mein-konto/registrieren', icon: '📝', label: 'Registrieren' },
      { to: '/support-kontakt', icon: '💬', label: 'Support kontaktieren' },
      { to: '/impressum', icon: '⚖️', label: 'Impressum' },
      { to: '/datenschutz', icon: '🛡️', label: 'Datenschutz' },
    ],
  },
  {
    label: 'Vernetzen',
    entries: [
      { to: '/chat-forum', icon: '💭', label: 'Chat-Forum' },
      { to: '/forum-verwalten', icon: '🛠️', label: 'Forum verwalten' },
      { to: '/meine-gruppen', icon: '👥', label: 'Meine Gruppen' },
      { to: '/gruppen-verwalten', icon: '🧭', label: 'Gruppen verwalten' },
    ],
  },
]

const dropdownPlaceholderPages: Page[] = [
  {
    slug: 'quiz',
    label: 'Quiz',
    highlight: 'QUIZ',
    fallbackText: 'Hier steht später dein Quiz-Bereich mit direktem Feedback.',
  },
  {
    slug: 'support-kontakt',
    label: 'Support kontaktieren',
    highlight: 'SUPPORT',
    fallbackText: 'Hier kannst du künftig Support-Anfragen und Hilfetickets einreichen.',
  },
  {
    slug: 'impressum',
    label: 'Impressum',
    highlight: 'LEGAL',
    fallbackText: 'Hier steht das Impressum mit allen rechtlich erforderlichen Angaben.',
  },
  {
    slug: 'datenschutz',
    label: 'Datenschutz',
    highlight: 'PRIVACY',
    fallbackText: 'Hier findest du die Informationen zum Datenschutz der Plattform.',
  },
  {
    slug: 'chat-forum',
    label: 'Chat-Forum',
    highlight: 'FORUM',
    fallbackText: 'Hier entsteht der Austauschbereich für Fragen und Diskussionen.',
  },
  {
    slug: 'forum-verwalten',
    label: 'Forum verwalten',
    highlight: 'MOD',
    fallbackText: 'Hier steuerst du Moderation, Bereiche und Forumseinstellungen.',
  },
  {
    slug: 'meine-gruppen',
    label: 'Meine Gruppen',
    highlight: 'GRUPPEN',
    fallbackText: 'Hier siehst und verwaltest du deine aktiven Lerngruppen.',
  },
  {
    slug: 'gruppen-verwalten',
    label: 'Gruppen verwalten',
    highlight: 'ADMIN',
    fallbackText: 'Hier pflegst du Gruppenrechte, Regeln und Mitgliedschaften.',
  },
]

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const moduleSamples: ModuleSummary[] = [
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
]

const initialModulePdfs: Record<string, ModulePdf[]> = {
  'mod-1': [
    {
      id: 'pdf-1-1',
      fileName: 'Lineare-Algebra-Skript.pdf',
      uploadedAt: '2026-03-12',
      uploader: 'Mia Sommer',
    },
  ],
  'mod-2': [
    {
      id: 'pdf-2-1',
      fileName: 'Neuronale-Netze-Zusatz.pdf',
      uploadedAt: '2026-03-16',
      uploader: 'Jonas Winter',
    },
  ],
  'mod-3': [
    {
      id: 'pdf-3-1',
      fileName: 'Architektur-Patterns-Reader.pdf',
      uploadedAt: '2026-03-20',
      uploader: 'Lea Kranz',
    },
  ],
}

const moduleDraftStorageKey = 'studentenhub-module-drafts'

const initialFlashcardDecks: FlashcardDeck[] = [
  {
    id: 'deck-1',
    name: 'Algebra Basics',
    creator: 'Mia Sommer',
    topic: 'Mathematik',
    cardCount: 3,
    cards: [
      { id: 'deck-1-card-1', front: 'Was ist eine Matrix?', back: 'Eine rechteckige Anordnung von Zahlen.' },
      { id: 'deck-1-card-2', front: 'Was ist eine Determinante?', back: 'Ein Skalarwert, der Eigenschaften einer Matrix beschreibt.' },
      { id: 'deck-1-card-3', front: 'Was ist ein Eigenwert?', back: 'Ein Faktor, um den ein Eigenvektor skaliert wird.' },
    ],
  },
  {
    id: 'deck-2',
    name: 'Netzwerke Einführung',
    creator: 'Jonas Winter',
    topic: 'Informatik',
    cardCount: 2,
    cards: [
      { id: 'deck-2-card-1', front: 'Wofür steht TCP?', back: 'Transmission Control Protocol.' },
      { id: 'deck-2-card-2', front: 'Wofür steht DNS?', back: 'Domain Name System.' },
    ],
  },
]

const gameEntries: GameEntry[] = [
  {
    id: 'pulse',
    title: 'Pulse Game',
    location: '/Users/florian/Cloud5.0/SPIELE/pulse-game.html',
    icon: '🫀',
    mode: 'iframe',
  },
  {
    id: 'realm-builder',
    title: 'RealmBuilder V5',
    location: '/Users/florian/Cloud5.0/SPIELE/RealmBuilderV5.jsx',
    icon: '🏰',
    mode: 'component',
  },
  {
    id: 'typing-arena',
    title: 'Typing Arena Preview',
    location: '/Users/florian/Cloud5.0/SPIELE/typing-arena-preview.jsx',
    icon: '⌨️',
    mode: 'component',
  },
]

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function toRichText(value: string) {
  const text = value.trim()
  if (!text) {
    return '<p></p>'
  }
  if (text.includes('<') && text.includes('>')) {
    return text
  }
  return `<p>${escapeHtml(text)}</p>`
}

function createModuleDraftMap() {
  return moduleSamples.reduce<Record<string, ModuleSummary>>((acc, moduleItem) => {
    acc[moduleItem.id] = {
      ...moduleItem,
      intro: toRichText(moduleItem.intro),
      terms: toRichText(moduleItem.terms),
      focus: toRichText(moduleItem.focus),
    }
    return acc
  }, {})
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!editorRef.current) {
      return
    }
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  function runCommand(command: string, commandValue?: string) {
    if (!editorRef.current) {
      return
    }
    editorRef.current.focus()
    if (command === 'increaseFontSize' || command === 'decreaseFontSize') {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return
      }
    }
    document.execCommand(command, false, commandValue)
    onChange(editorRef.current.innerHTML)
  }

  return (
    <div className="rich-editor">
      <div
        ref={editorRef}
        className="rich-editor-surface"
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
      />
      <div className="rich-editor-toolbar">
        <button type="button" title="Blau" onClick={() => runCommand('foreColor', '#004BFF')}>
          <span className="tool-color tool-blue" />
        </button>
        <button type="button" title="Rot" onClick={() => runCommand('foreColor', '#C50028')}>
          <span className="tool-color tool-red" />
        </button>
        <button type="button" title="Grün" onClick={() => runCommand('foreColor', '#0F8A3A')}>
          <span className="tool-color tool-green" />
        </button>
        <button type="button" title="H1" onClick={() => runCommand('formatBlock', 'H1')}>
          H1
        </button>
        <button type="button" title="H2" onClick={() => runCommand('formatBlock', 'H2')}>
          H2
        </button>
        <button type="button" title="H3" onClick={() => runCommand('formatBlock', 'H3')}>
          H3
        </button>
        <button type="button" title="Fett" onClick={() => runCommand('bold')}>
          <strong>B</strong>
        </button>
        <button type="button" title="Kursiv" onClick={() => runCommand('italic')}>
          <em>S</em>
        </button>
        <button type="button" title="Unterstrichen" onClick={() => runCommand('underline')}>
          <span className="tool-underline">U</span>
        </button>
        <button type="button" title="Größer" onClick={() => runCommand('increaseFontSize')}>
          H↑
        </button>
        <button type="button" title="Kleiner" onClick={() => runCommand('decreaseFontSize')}>
          H↓
        </button>
      </div>
    </div>
  )
}

function PlaceholderPage({
  page,
  section,
}: {
  page: Page
  section?: Section
}) {
  return (
    <section className="placeholder-card">
      <p className="card-tag">{page.highlight}</p>
      <h2>{section?.title ?? page.label}</h2>
      <h3>{section?.subtitle ?? 'Platzhalter-Seite'}</h3>
      <p>{section?.description ?? page.fallbackText}</p>
      <button type="button">Modul bald verfügbar</button>
    </section>
  )
}

function AccountPage({ section }: { section?: Section }) {
  return (
    <section className="placeholder-card">
      <p className="card-tag">ZUGANG</p>
      <h2>{section?.title ?? 'Mein Konto'}</h2>
      <h3>{section?.subtitle ?? 'Sicherer Zugang'}</h3>
      <p>
        {section?.description ??
          'Wähle hier zwischen Anmeldung und Registrierung für deinen Zugang.'}
      </p>
      <div className="account-actions">
        <NavLink to="/mein-konto/anmelden" className="account-link">
          Anmelden
        </NavLink>
        <NavLink to="/mein-konto/registrieren" className="account-link">
          Registrieren
        </NavLink>
      </div>
    </section>
  )
}

function AuthPage({ mode }: { mode: 'anmelden' | 'registrieren' }) {
  const isLogin = mode === 'anmelden'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    setIsSubmitting(true)

    try {
      if (isLogin) {
        const response = await fetch(`${apiBase}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        })

        const payload = (await response.json()) as { user?: { username?: string }; message?: string }
        if (!response.ok) {
          throw new Error(payload.message ?? 'Anmeldung fehlgeschlagen.')
        }

        setMessage(
          `Anmeldung erfolgreich. Willkommen ${payload.user?.username ?? username.trim()}.`,
        )
      } else {
        const response = await fetch(`${apiBase}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: email.trim(),
            password,
            passwordRepeat,
          }),
        })

        const payload = (await response.json()) as { message?: string }
        if (!response.ok) {
          throw new Error(payload.message ?? 'Registrierung fehlgeschlagen.')
        }

        setMessage(payload.message ?? 'Registrierung erfolgreich.')
        setEmail('')
        setPassword('')
        setPasswordRepeat('')
      }
    } catch (submitError) {
      const submitMessage =
        submitError instanceof Error ? submitError.message : 'Aktion fehlgeschlagen.'
      setError(submitMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="placeholder-card">
      <p className="card-tag">{isLogin ? 'LOGIN' : 'NEU'}</p>
      <h2>{isLogin ? 'Anmelden' : 'Registrieren'}</h2>
      <h3>{isLogin ? 'Willkommen zurück' : 'Neues Konto erstellen'}</h3>
      <form className="auth-form" onSubmit={handleSubmit}>
        {isLogin ? (
          <>
            <label className="auth-field">
              <span>Benutzername</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="dein.benutzername"
                autoComplete="username"
                required
              />
            </label>
            <label className="auth-field">
              <span>Passwort</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
          </>
        ) : (
          <>
            <label className="auth-field">
              <span>E-Mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@domain.de"
                autoComplete="email"
                required
              />
            </label>
            <label className="auth-field">
              <span>Passwort</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="auth-field">
              <span>Passwort wiederholen</span>
              <input
                type="password"
                value={passwordRepeat}
                onChange={(event) => setPasswordRepeat(event.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
          </>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Wird gesendet...'
            : isLogin
              ? 'Anmelden'
              : 'Registrieren'}
        </button>
      </form>
      {message && <p className="auth-message success">{message}</p>}
      {error && <p className="auth-message error">{error}</p>}
      <p className="auth-note">
        Jeder erfolgreiche Login erhält automatisch die Rolle authenticated.
      </p>
      <div className="account-actions">
        <NavLink to="/mein-konto" className="account-link">
          Zurück zu Mein Konto
        </NavLink>
      </div>
    </section>
  )
}

function StartPage() {
  return (
    <section className="placeholder-card">
      <p className="card-tag">START</p>
      <h2>Roadmap StudyCloud</h2>
      <h3>So wächst die Plattform</h3>
      <ul className="landing-roadmap">
        <li>
          <span className="roadmap-icon">🧠</span>
          <div>
            <strong>Zusammenfassungen</strong>
            <p>Intelligente Struktur, Themenzuordnung und Live-Bearbeitung.</p>
          </div>
        </li>
        <li>
          <span className="roadmap-icon">🗂</span>
          <div>
            <strong>Karteikarten</strong>
            <p>Adaptive Decks, Play-Session, Feedback und Lernverlauf.</p>
          </div>
        </li>
        <li>
          <span className="roadmap-icon">🎮</span>
          <div>
            <strong>Spiele & Quiz</strong>
            <p>Gamified Training, Punkte, Challenges und tägliche Ziele.</p>
          </div>
        </li>
      </ul>
      <div className="account-actions">
        <NavLink to="/zusammenfassungen" className="account-link">
          Zu den Zusammenfassungen
        </NavLink>
      </div>
    </section>
  )
}

function HeroLoopVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const reverseRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const reverseSpeedRef = useRef(0.5)

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    video.playbackRate = 0.5

    const playForward = () => {
      reverseRef.current = false
      video.playbackRate = 0.5
      void video.play()
    }

    const runBackward = () => {
      reverseRef.current = true
      video.pause()
      lastTimestampRef.current = null

      const step = (timestamp: number) => {
        if (!videoRef.current || !reverseRef.current) {
          return
        }
        const previous = lastTimestampRef.current ?? timestamp
        const deltaSeconds = Math.max((timestamp - previous) / 1000, 0)
        lastTimestampRef.current = timestamp
        const stepAmount = deltaSeconds * reverseSpeedRef.current
        const next = Math.max(videoRef.current.currentTime - stepAmount, 0)
        videoRef.current.currentTime = next
        if (next <= 0) {
          reverseRef.current = false
          lastTimestampRef.current = null
          videoRef.current.playbackRate = 0.5
          void videoRef.current.play()
          return
        }
        frameRef.current = window.requestAnimationFrame(step)
      }

      frameRef.current = window.requestAnimationFrame(step)
    }

    const handleEnded = () => {
      runBackward()
    }

    video.addEventListener('ended', handleEnded)
    playForward()

    return () => {
      video.removeEventListener('ended', handleEnded)
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const videoSrc = `${import.meta.env.BASE_URL}Hero.mp4`

  return (
    <video
      ref={videoRef}
      className="hero-video"
      src={videoSrc}
      muted
      playsInline
      preload="auto"
    />
  )
}

function CloseIconButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="close-view-button"
      onClick={onClick}
      aria-label="Ansicht schließen"
      title="Ansicht schließen"
    >
      ✕
    </button>
  )
}

function FlashcardsPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>(initialFlashcardDecks)
  const [deckOffset, setDeckOffset] = useState(initialFlashcardDecks.length)
  const [hasMoreDecks, setHasMoreDecks] = useState(true)
  const [isLoadingDecks, setIsLoadingDecks] = useState(false)
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)
  const [playDeckId, setPlayDeckId] = useState<string | null>(null)
  const [editorDeck, setEditorDeck] = useState<FlashcardDeck | null>(null)
  const [isSavingDeck, setIsSavingDeck] = useState(false)
  const [flashcardMessage, setFlashcardMessage] = useState('')
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [playCardIndex, setPlayCardIndex] = useState(0)
  const [isAnswerVisible, setIsAnswerVisible] = useState(false)
  const [isPlayBackVisible, setIsPlayBackVisible] = useState(false)
  const [playResult, setPlayResult] = useState<{ right: number; wrong: number } | null>(null)
  const [playStats, setPlayStats] = useState<{ right: number; wrong: number }>({
    right: 0,
    wrong: 0,
  })
  const [feedbackCounts, setFeedbackCounts] = useState<Record<string, { right: number; wrong: number }>>({})
  const [isDeletingDeck, setIsDeletingDeck] = useState<string | null>(null)

  const loadMoreDecks = useCallback(async () => {
    if (isLoadingDecks || !hasMoreDecks) {
      return
    }
    setIsLoadingDecks(true)

    try {
      const response = await fetch(
        `${apiBase}/content/flashcards/decks?limit=5&offset=${deckOffset}`,
      )
      if (!response.ok) {
        setHasMoreDecks(false)
        return
      }
      const payload = (await response.json()) as FlashcardDeck[]
      if (!Array.isArray(payload)) {
        setHasMoreDecks(false)
        return
      }

      const normalized = payload.map((deck) => ({
        ...deck,
        cardCount: Array.isArray(deck.cards) ? deck.cards.length : 0,
        cards: Array.isArray(deck.cards) ? deck.cards : [],
      }))

      let addedCount = 0
      setDecks((current) => {
        const merged = [...current]
        normalized.forEach((incoming) => {
          const index = merged.findIndex((item) => item.id === incoming.id)
          if (index === -1) {
            merged.push(incoming)
            addedCount += 1
          } else {
            merged[index] = incoming
          }
        })
        return merged
      })
      setDeckOffset((current) => current + normalized.length)
      if (normalized.length < 5 || addedCount === 0) {
        setHasMoreDecks(false)
      }
    } catch {
      setFlashcardMessage('Deckliste konnte nicht erweitert werden.')
      setHasMoreDecks(false)
    } finally {
      setIsLoadingDecks(false)
    }
  }, [deckOffset, hasMoreDecks, isLoadingDecks])

  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId) ?? null,
    [activeDeckId, decks],
  )
  const playDeck = useMemo(
    () => decks.find((deck) => deck.id === playDeckId) ?? null,
    [decks, playDeckId],
  )

  const activeCard = activeDeck?.cards[activeCardIndex] ?? null
  const playCard = playDeck?.cards[playCardIndex] ?? null
  const activeFeedback = activeDeck ? feedbackCounts[activeDeck.id] ?? { right: 0, wrong: 0 } : null

  function openDeckView(deckId: string) {
    setActiveDeckId(deckId)
    setPlayDeckId(null)
    setEditorDeck(null)
    setActiveCardIndex(0)
    setIsAnswerVisible(false)
    setFlashcardMessage('')
  }

  function openDeckEditor(deckId: string) {
    const deck = decks.find((item) => item.id === deckId)
    if (!deck) {
      return
    }
    setEditorDeck({
      ...deck,
      cards: deck.cards.map((card) => ({ ...card })),
    })
    setActiveDeckId(null)
    setPlayDeckId(null)
    setFlashcardMessage('')
  }

  function openDeckPlay(deckId: string) {
    setPlayDeckId(deckId)
    setActiveDeckId(null)
    setEditorDeck(null)
    setPlayCardIndex(0)
    setIsPlayBackVisible(false)
    setPlayStats({ right: 0, wrong: 0 })
    setPlayResult(null)
    setFlashcardMessage('')
  }

  async function deleteDeck(deckId: string) {
    const target = decks.find((deck) => deck.id === deckId)
    if (!target || isDeletingDeck) {
      return
    }
    setIsDeletingDeck(deckId)
    try {
      const response = await fetch(`${apiBase}/content/flashcards/decks/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          deckId,
          requester: 'Aktiver User',
          isAdmin: true,
        }),
      })
      const payload = (await response.json()) as { deleted?: boolean; message?: string }
      if (!response.ok || !payload.deleted) {
        throw new Error(payload.message ?? 'Deck konnte nicht gelöscht werden.')
      }
      setDecks((current) => current.filter((deck) => deck.id !== deckId))
      if (activeDeckId === deckId) {
        setActiveDeckId(null)
      }
      if (playDeckId === deckId) {
        setPlayDeckId(null)
      }
      if (editorDeck?.id === deckId) {
        setEditorDeck(null)
      }
    } catch (error) {
      setFlashcardMessage(
        error instanceof Error ? error.message : 'Deck konnte nicht gelöscht werden.',
      )
    } finally {
      setIsDeletingDeck(null)
    }
  }

  function startNewDeck() {
    setEditorDeck({
      id: `deck-${Date.now()}`,
      name: '',
      creator: 'Aktiver User',
      topic: '',
      cardCount: 0,
      cards: [{ id: `card-${Date.now()}`, front: '', back: '' }],
    })
    setActiveDeckId(null)
    setPlayDeckId(null)
    setFlashcardMessage('')
  }

  function updateEditorField(key: keyof Pick<FlashcardDeck, 'name' | 'creator' | 'topic'>, value: string) {
    setEditorDeck((current) => (current ? { ...current, [key]: value } : current))
  }

  function updateEditorCard(cardId: string, key: keyof FlashcardCard, value: string) {
    setEditorDeck((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        cards: current.cards.map((card) =>
          card.id === cardId ? { ...card, [key]: value } : card,
        ),
      }
    })
  }

  function addEditorCard() {
    setEditorDeck((current) =>
      current
        ? {
            ...current,
            cards: [
              ...current.cards,
              { id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, front: '', back: '' },
            ],
          }
        : current,
    )
  }

  function deleteEditorCard(cardId: string) {
    setEditorDeck((current) =>
      current
        ? {
            ...current,
            cards: current.cards.filter((card) => card.id !== cardId),
          }
        : current,
    )
  }

  async function saveDeck() {
    if (!editorDeck) {
      return
    }

    if (!editorDeck.name.trim() || !editorDeck.creator.trim() || !editorDeck.topic.trim()) {
      setFlashcardMessage('Bitte Name, Ersteller und Thema ausfüllen.')
      return
    }

    const validCards = editorDeck.cards.filter(
      (card) => card.front.trim().length > 0 && card.back.trim().length > 0,
    )

    if (!validCards.length) {
      setFlashcardMessage('Bitte mindestens eine Karte mit Vorder- und Rückseite anlegen.')
      return
    }

    setIsSavingDeck(true)
    try {
      const response = await fetch(`${apiBase}/content/flashcards/decks/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          deckId: editorDeck.id,
          name: editorDeck.name,
          creator: editorDeck.creator,
          topic: editorDeck.topic,
          cards: validCards.map((card) => ({
            id: card.id,
            front: card.front,
            back: card.back,
          })),
        }),
      })

      const payload = (await response.json()) as { saved?: boolean; deckId?: string; message?: string }
      if (!response.ok || !payload.saved) {
        throw new Error(payload.message ?? 'Deck konnte nicht gespeichert werden.')
      }

      const updatedDeck: FlashcardDeck = {
        ...editorDeck,
        id: payload.deckId ?? editorDeck.id,
        cards: validCards,
        cardCount: validCards.length,
      }

      setDecks((current) => {
        const existing = current.find((deck) => deck.id === updatedDeck.id)
        if (existing) {
          return current.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck))
        }
        return [updatedDeck, ...current]
      })
      setEditorDeck(null)
      setFlashcardMessage('Deck erfolgreich gespeichert.')
    } catch (error) {
      setFlashcardMessage(error instanceof Error ? error.message : 'Deck konnte nicht gespeichert werden.')
    } finally {
      setIsSavingDeck(false)
    }
  }

  function handleFeedback(isRight: boolean) {
    if (!activeDeck || !activeCard) {
      return
    }
    setFeedbackCounts((current) => {
      const currentDeck = current[activeDeck.id] ?? { right: 0, wrong: 0 }
      return {
        ...current,
        [activeDeck.id]: {
          right: currentDeck.right + (isRight ? 1 : 0),
          wrong: currentDeck.wrong + (isRight ? 0 : 1),
        },
      }
    })
    setIsAnswerVisible(false)
    setActiveCardIndex((current) => {
      const next = current + 1
      if (!activeDeck.cards.length) {
        return 0
      }
      return next >= activeDeck.cards.length ? 0 : next
    })
  }

  function handlePlayFeedback(isRight: boolean) {
    if (!playDeck || !playCard) {
      return
    }

    const nextStats = {
      right: playStats.right + (isRight ? 1 : 0),
      wrong: playStats.wrong + (isRight ? 0 : 1),
    }
    const isLast = playCardIndex >= playDeck.cards.length - 1

    if (isLast) {
      setPlayStats(nextStats)
      setPlayResult(nextStats)
      setIsPlayBackVisible(false)
      return
    }

    setPlayStats(nextStats)
    setPlayCardIndex((current) => current + 1)
    setIsPlayBackVisible(false)
  }

  function restartPlaySession() {
    setPlayCardIndex(0)
    setPlayStats({ right: 0, wrong: 0 })
    setPlayResult(null)
    setIsPlayBackVisible(false)
  }

  return (
    <section className="flashcards-layout">
      <div className="summary-list-container">
        <p className="card-tag">Karteikarten-Liste</p>
        <p>Decks mit Name, Ersteller, Thema und Anzahl der Karten.</p>
        <button type="button" className="add-deck-button" onClick={startNewDeck}>
          Deck hinzufügen
        </button>
        <ul className="deck-list">
          {decks.map((deck) => (
            <li key={deck.id}>
              <div className="module-list-content">
                <span className="module-list-main">{deck.name}</span>
                <span className="module-list-meta">
                  Ersteller: {deck.creator} · Thema: {deck.topic} · Karten: {deck.cardCount}
                </span>
              </div>
              <div className="module-actions">
                <button
                  type="button"
                  className="module-icon-button"
                  onClick={() => openDeckView(deck.id)}
                  title="Ansicht"
                  aria-label="Ansicht"
                >
                  👁
                </button>
                <button
                  type="button"
                  className="module-icon-button module-gear-button"
                  onClick={() => openDeckEditor(deck.id)}
                  title="Bearbeiten"
                  aria-label="Bearbeiten"
                >
                  ⚙
                </button>
                <button
                  type="button"
                  className="module-icon-button"
                  onClick={() => openDeckPlay(deck.id)}
                  title="Play"
                  aria-label="Play"
                >
                  ▶
                </button>
                <button
                  type="button"
                  className="module-delete-button"
                  onClick={() => void deleteDeck(deck.id)}
                  title="Deck löschen"
                  aria-label="Deck löschen"
                >
                  {isDeletingDeck === deck.id ? '…' : '✕'}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {hasMoreDecks && (
          <button
            type="button"
            className="load-more-button"
            disabled={isLoadingDecks}
            onClick={() => void loadMoreDecks()}
          >
            {isLoadingDecks ? 'Lädt…' : 'Mehr Anzeigen'}
          </button>
        )}
      </div>

      {(activeDeck || editorDeck || playDeck) && (
        <div className="summary-detail-container">
          {playDeck ? (
            <>
              {playResult ? (
                <div className="play-result-popup">
                  <h3>Du hast es geschafft.</h3>
                  <p>
                    {playResult.right} Karten wusstest du. {playResult.wrong} wusstest du nicht.
                  </p>
                  <div className="detail-action-row">
                    <button
                      type="button"
                      onClick={() => {
                        setPlayDeckId(null)
                        setPlayResult(null)
                      }}
                    >
                      Zurück zur Liste
                    </button>
                    <button type="button" onClick={restartPlaySession}>
                      Nochmal starten
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="module-view-header">
                    <h2>{playDeck.name}</h2>
                    <p className="module-view-tag">Play-Session</p>
                  </div>
                  <p>Thema: {playDeck.topic}</p>
                  <p>Ersteller: {playDeck.creator}</p>
                  {playCard ? (
                    <div className="flashcard-play-area">
                      <div
                        className={`flashcard-scene ${isPlayBackVisible ? 'show-back' : ''}`}
                        onClick={() => setIsPlayBackVisible((current) => !current)}
                      >
                        <div className="flashcard-inner">
                          <div className="flashcard-face front">
                            <h3>Vorderseite</h3>
                            <p>{playCard.front}</p>
                          </div>
                          <div className="flashcard-face back">
                            <h3>Rückseite</h3>
                            <p>{playCard.back}</p>
                          </div>
                        </div>
                      </div>
                  <div className="play-feedback-row">
                    <button
                      type="button"
                      className="feedback-button wrong"
                      onClick={() => handlePlayFeedback(false)}
                    >
                      Nicht gewusst
                    </button>
                    <button
                      type="button"
                      className="feedback-button right"
                      onClick={() => handlePlayFeedback(true)}
                    >
                      Gewusst
                    </button>
                  </div>
                </div>
                  ) : (
                    <p>Dieses Deck enthält aktuell keine Karten.</p>
                  )}
                  <div className="detail-action-row">
                    <CloseIconButton
                      onClick={() => {
                        setPlayDeckId(null)
                        setPlayResult(null)
                      }}
                    />
                  </div>
                </>
              )}
            </>
          ) : activeDeck ? (
            <>
              <div className="module-view-header">
                <h2>{activeDeck.name}</h2>
                <p className="module-view-tag">Deck-Ansicht</p>
              </div>
              <p>Thema: {activeDeck.topic}</p>
              <p>Ersteller: {activeDeck.creator}</p>
              {activeCard ? (
                <div className="module-glass-card">
                  <h3>
                    Karte {activeCardIndex + 1}/{activeDeck.cards.length}
                  </h3>
                  <p><strong>Vorderseite:</strong> {activeCard.front}</p>
                  {isAnswerVisible && <p><strong>Rückseite:</strong> {activeCard.back}</p>}
                  <div className="detail-action-row">
                    <button
                      type="button"
                      className="card-switch-button"
                      onClick={() =>
                        setActiveCardIndex((current) =>
                          current <= 0 ? activeDeck.cards.length - 1 : current - 1,
                        )
                      }
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="card-switch-button"
                      onClick={() =>
                        setActiveCardIndex((current) =>
                          current >= activeDeck.cards.length - 1 ? 0 : current + 1,
                        )
                      }
                    >
                      →
                    </button>
                    <button type="button" onClick={() => setIsAnswerVisible((current) => !current)}>
                      {isAnswerVisible ? 'Antwort ausblenden' : 'Antwort anzeigen'}
                    </button>
                    <button type="button" onClick={() => handleFeedback(true)}>
                      Richtig
                    </button>
                    <button type="button" onClick={() => handleFeedback(false)}>
                      Falsch
                    </button>
                  </div>
                </div>
              ) : (
                <p>Dieses Deck enthält aktuell keine Karten.</p>
              )}
              <p className="module-save-message">
                Richtig: {activeFeedback?.right ?? 0} · Falsch: {activeFeedback?.wrong ?? 0}
              </p>
              <div className="detail-action-row">
                <CloseIconButton onClick={() => setActiveDeckId(null)} />
              </div>
            </>
          ) : editorDeck ? (
            <>
              <div className="module-view-header">
                <h2>Deck bearbeiten</h2>
                <p className="module-view-tag">Editor</p>
              </div>
              <label className="deck-field">
                <span>Name des Decks</span>
                <input
                  value={editorDeck.name}
                  onChange={(event) => updateEditorField('name', event.target.value)}
                />
              </label>
              <label className="deck-field">
                <span>Ersteller</span>
                <input
                  value={editorDeck.creator}
                  onChange={(event) => updateEditorField('creator', event.target.value)}
                />
              </label>
              <label className="deck-field">
                <span>Thema</span>
                <input
                  value={editorDeck.topic}
                  onChange={(event) => updateEditorField('topic', event.target.value)}
                />
              </label>

              <div className="deck-card-editor-list">
                {editorDeck.cards.map((card, index) => (
                  <div key={card.id} className="module-glass-card">
                    <h3>Karte {index + 1}</h3>
                    <label className="deck-field">
                      <span>Vorderseite</span>
                      <textarea
                        value={card.front}
                        onChange={(event) => updateEditorCard(card.id, 'front', event.target.value)}
                      />
                    </label>
                    <label className="deck-field">
                      <span>Rückseite</span>
                      <textarea
                        value={card.back}
                        onChange={(event) => updateEditorCard(card.id, 'back', event.target.value)}
                      />
                    </label>
                    <button type="button" onClick={() => deleteEditorCard(card.id)}>
                      Karte löschen
                    </button>
                  </div>
                ))}
              </div>

              {flashcardMessage && <p className="module-save-message">{flashcardMessage}</p>}
              <div className="detail-action-row">
                <button type="button" onClick={addEditorCard}>
                  Karte hinzufügen
                </button>
                <button type="button" onClick={() => void saveDeck()}>
                  {isSavingDeck ? 'Speichert...' : 'Deck speichern'}
                </button>
                <CloseIconButton onClick={() => setEditorDeck(null)} />
              </div>
            </>
          ) : null}
        </div>
      )}
    </section>
  )
}

function SpielePage({ activeGameId }: { activeGameId?: string }) {
  const navigate = useNavigate()

  const activeGame = useMemo(
    () => gameEntries.find((entry) => entry.id === activeGameId) ?? null,
    [activeGameId],
  )

  const gameRenderer = useMemo(() => {
    if (!activeGame) {
      return null
    }
    if (activeGame.id === 'pulse') {
      return (
        <iframe
          title="Pulse Game"
          src={`${import.meta.env.BASE_URL}games/pulse-game.html`}
          className="game-fullscreen-frame"
        />
      )
    }
    if (activeGame.id === 'realm-builder') {
      return (
        <div className="game-component-host">
          <RealmBuilderV5 />
        </div>
      )
    }
    return (
      <div className="game-component-host">
        <TypingArenaPreview />
      </div>
    )
  }, [activeGame])

  if (activeGame) {
    return (
      <section className="game-fullscreen">
        <div className="game-fullscreen-topbar">
          <p className="module-list-main">{activeGame.title}</p>
          <CloseIconButton
            onClick={() => {
              navigate('/spiele')
            }}
          />
        </div>
        {gameRenderer}
      </section>
    )
  }

  return (
    <section className="summary-layout">
      <div className="summary-list-container">
        <p className="card-tag">Spieleliste</p>
        <p>Diese Spiele wurden aus dem SPIELE-Verzeichnis übernommen.</p>
        <ul className="game-list">
          {gameEntries.map((game) => (
            <li key={game.id}>
              <div className="game-list-main">
                <span className="game-icon">{game.icon}</span>
                <div className="module-list-content">
                  <span className="module-list-main">{game.title}</span>
                  <span className="module-list-meta">{game.location}</span>
                </div>
              </div>
              <button
                type="button"
                className="module-icon-button"
                onClick={() => navigate(`/spiele/${game.id}`)}
                aria-label={`${game.title} spielen`}
                title="Play"
              >
                ▶
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function SummariesPage() {
  const [query, setQuery] = useState('')
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [activePdfModuleId, setActivePdfModuleId] = useState<string | null>(null)
  const [isEditEnabled, setIsEditEnabled] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isDeletingModule, setIsDeletingModule] = useState<string | null>(null)
  const [savePopup, setSavePopup] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [apiOffset, setApiOffset] = useState(0)
  const [hasMoreModules, setHasMoreModules] = useState(true)
  const [pdfMap, setPdfMap] = useState<Record<string, ModulePdf[]>>(initialModulePdfs)
  const [moduleDraftMap, setModuleDraftMap] =
    useState<Record<string, ModuleSummary>>(createModuleDraftMap)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(moduleDraftStorageKey)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as Record<string, Partial<ModuleSummary>>
      setModuleDraftMap((current) => {
        const next = { ...current }
        Object.entries(parsed).forEach(([moduleId, value]) => {
          const existing = next[moduleId]
          if (!existing) {
            return
          }
          next[moduleId] = {
            ...existing,
            name: typeof value.name === 'string' ? value.name : existing.name,
            intro:
              typeof value.intro === 'string'
                ? toRichText(value.intro)
                : existing.intro,
            terms:
              typeof value.terms === 'string'
                ? toRichText(value.terms)
                : existing.terms,
            focus:
              typeof value.focus === 'string'
                ? toRichText(value.focus)
                : existing.focus,
          }
        })
        return next
      })
    } catch {
      setSaveMessage('Lokaler Entwurf konnte nicht geladen werden.')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(moduleDraftStorageKey, JSON.stringify(moduleDraftMap))
  }, [moduleDraftMap])

  async function loadMoreModules() {
    if (isLoadingMore || !hasMoreModules) {
      return
    }
    setIsLoadingMore(true)

    try {
      const response = await fetch(
        `${apiBase}/content/modules?limit=3&offset=${apiOffset}`,
      )
      if (!response.ok) {
        throw new Error('Module konnten nicht geladen werden.')
      }
      const payload = (await response.json()) as ModuleApiItem[]
      const safeData = Array.isArray(payload) ? payload : []

      setModuleDraftMap((current) => {
        const next = { ...current }
        safeData.forEach((entry) => {
          if (!entry.id || !entry.name) {
            return
          }
          next[entry.id] = {
            id: entry.id,
            name: entry.name,
            uploadedAt: entry.uploadedAt ?? '',
            creator: entry.creator ?? '',
            theme: entry.theme ?? '',
            intro: toRichText(entry.intro ?? ''),
            terms: toRichText(entry.terms ?? ''),
            focus: toRichText(entry.focus ?? ''),
          }
        })
        return next
      })

      setApiOffset((current) => current + safeData.length)
      if (safeData.length < 3) {
        setHasMoreModules(false)
      }
    } catch {
      setSaveMessage('Modulliste konnte nicht erweitert werden.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const visibleModules = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const modules = Object.values(moduleDraftMap)
    if (!normalized) {
      return modules
    }
    return modules.filter((moduleItem) =>
      moduleItem.name.toLowerCase().includes(normalized),
    )
  }, [moduleDraftMap, query])

  const activeModule = useMemo(
    () =>
      (activeModuleId ? moduleDraftMap[activeModuleId] : null) ?? null,
    [activeModuleId, moduleDraftMap],
  )

  const editingModule = useMemo(
    () =>
      (editingModuleId ? moduleDraftMap[editingModuleId] : null) ?? null,
    [editingModuleId, moduleDraftMap],
  )

  const activePdfModule = useMemo(
    () =>
      (activePdfModuleId ? moduleDraftMap[activePdfModuleId] : null) ?? null,
    [activePdfModuleId, moduleDraftMap],
  )
  const isDetailVisible = Boolean(activePdfModule || activeModule || editingModule)

  function openModuleView(moduleId: string) {
    setActiveModuleId(moduleId)
    setEditingModuleId(null)
    setActivePdfModuleId(null)
    setIsEditEnabled(false)
    setSaveMessage('')
  }

  function openEditView(moduleId: string) {
    setEditingModuleId(moduleId)
    setActiveModuleId(null)
    setActivePdfModuleId(null)
    setIsEditEnabled(false)
    setSaveMessage('')
  }

  function createNewSummary() {
    const now = new Date()
    const moduleId = `mod-local-${now.getTime()}`
    const date = now.toISOString().slice(0, 10)
    setModuleDraftMap((current) => ({
      ...current,
      [moduleId]: {
        id: moduleId,
        name: 'Neue Zusammenfassung',
        uploadedAt: date,
        creator: 'Aktiver User',
        theme: '',
        intro: '<p></p>',
        terms: '<p></p>',
        focus: '<p></p>',
      },
    }))
    setQuery('')
    setEditingModuleId(moduleId)
    setActiveModuleId(null)
    setActivePdfModuleId(null)
    setIsEditEnabled(true)
    setSaveMessage('Neue Zusammenfassung erstellt.')
  }

  function openPdfView(moduleId: string) {
    setActivePdfModuleId(moduleId)
    setActiveModuleId(null)
    setEditingModuleId(null)
    setIsEditEnabled(false)
  }

  async function deleteModule(moduleId: string) {
    if (isDeletingModule) {
      return
    }
    const moduleEntry = moduleDraftMap[moduleId]
    if (!moduleEntry) {
      return
    }

    setIsDeletingModule(moduleId)
    try {
      const response = await fetch(`${apiBase}/content/modules/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          moduleId,
          requester: 'Aktiver User',
          isAdmin: true,
        }),
      })
      const payload = (await response.json()) as { deleted?: boolean; message?: string }
      if (!response.ok || !payload.deleted) {
        throw new Error(payload.message ?? 'Modul konnte nicht gelöscht werden.')
      }

      setModuleDraftMap((current) => {
        const next = { ...current }
        delete next[moduleId]
        return next
      })
      setPdfMap((current) => {
        const next = { ...current }
        delete next[moduleId]
        return next
      })
      if (activeModuleId === moduleId) {
        setActiveModuleId(null)
      }
      if (editingModuleId === moduleId) {
        setEditingModuleId(null)
      }
      if (activePdfModuleId === moduleId) {
        setActivePdfModuleId(null)
      }
      setSaveMessage('Zusammenfassung gelöscht.')
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : 'Modul konnte nicht gelöscht werden.',
      )
    } finally {
      setIsDeletingModule(null)
    }
  }

  function handlePdfUpload(moduleId: string, event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files?.length) {
      return
    }

    const additions = Array.from(files).map((file) => ({
      id: `${moduleId}-${Date.now()}-${file.name}`,
      fileName: file.name,
      uploadedAt: new Date().toISOString().slice(0, 10),
      uploader: 'Aktiver User',
    }))

    setPdfMap((current) => ({
      ...current,
      [moduleId]: [...(current[moduleId] ?? []), ...additions],
    }))

    event.target.value = ''
  }

  function handlePdfDownload(moduleId: string, pdfItem: ModulePdf) {
    const blob = new Blob(
      [
        `Modul: ${moduleId}\nDatei: ${pdfItem.fileName}\nHochgeladen: ${pdfItem.uploadedAt}\nErsteller: ${pdfItem.uploader}`,
      ],
      { type: 'application/pdf' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = pdfItem.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  function handlePdfDelete(moduleId: string, pdfId: string) {
    setPdfMap((current) => ({
      ...current,
      [moduleId]: (current[moduleId] ?? []).filter((entry) => entry.id !== pdfId),
    }))
  }

  function updateEditingModuleField(
    key: keyof Pick<ModuleSummary, 'name' | 'theme' | 'intro' | 'terms' | 'focus'>,
    value: string,
  ) {
    if (!editingModuleId) {
      return
    }

    setModuleDraftMap((current) => {
      const currentModule = current[editingModuleId]
      if (!currentModule) {
        return current
      }
      return {
        ...current,
        [editingModuleId]: {
          ...currentModule,
          [key]: value,
        },
      }
    })
    setSaveMessage('Lokaler Entwurf aktualisiert.')
  }

  const saveModuleToDatabase = useCallback(
    async (mode: 'manual' | 'auto') => {
      if (!editingModuleId) {
        return
      }
      const moduleEntry = moduleDraftMap[editingModuleId]
      if (!moduleEntry) {
        return
      }

      if (mode === 'manual') {
        setIsSaving(true)
        try {
          const controller = new AbortController()
          const timeout = window.setTimeout(() => controller.abort(), 10000)
          const statusResponse = await fetch(`${apiBase}/content/status`, {
            signal: controller.signal,
          })
          window.clearTimeout(timeout)
          if (!statusResponse.ok) {
            setSavePopup({
              type: 'error',
              text: 'Speichern konnte nicht durchgeführt werden',
            })
            setIsSaving(false)
            return
          }
          const statusPayload = (await statusResponse.json()) as { connected?: boolean }
          if (!statusPayload.connected) {
            setSavePopup({
              type: 'error',
              text: 'Speichern konnte nicht durchgeführt werden',
            })
            setIsSaving(false)
            return
          }
        } catch {
          setSavePopup({
            type: 'error',
            text: 'Speichern konnte nicht durchgeführt werden',
          })
          setIsSaving(false)
          return
        }
      }

      try {
        const response = await fetch(`${apiBase}/content/modules/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            moduleId: moduleEntry.id,
            name: moduleEntry.name,
            intro: moduleEntry.intro,
            terms: moduleEntry.terms,
            focus: moduleEntry.focus,
            uploadedAt: moduleEntry.uploadedAt,
            creator: moduleEntry.creator,
            theme: moduleEntry.theme,
            mode,
          }),
        })

        const payload = (await response.json()) as {
          saved?: boolean
          message?: string
        }

        if (!response.ok || !payload.saved) {
          throw new Error(payload.message ?? 'Speichern fehlgeschlagen.')
        }

        setSaveMessage(
          mode === 'manual'
            ? 'Modul in Supabase gespeichert.'
            : 'Autosave in Supabase synchronisiert.',
        )
        if (mode === 'manual') {
          setSavePopup({
            type: 'success',
            text: 'Speichern erfolgreich durchgeführt.',
          })
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Speichern fehlgeschlagen.'
        setSaveMessage(message)
      } finally {
        if (mode === 'manual') {
          setIsSaving(false)
        }
      }
    },
    [editingModuleId, moduleDraftMap],
  )

  useEffect(() => {
    if (!editingModuleId || !isEditEnabled) {
      return
    }

    const interval = window.setInterval(() => {
      void saveModuleToDatabase('auto')
    }, 12000)

    return () => window.clearInterval(interval)
  }, [editingModuleId, isEditEnabled, saveModuleToDatabase])

  return (
    <section className="summary-layout">
      <div className="summary-list-container">
        <p className="card-tag">Modul-Liste</p>
        <p>In der Liste siehst du die Modultitel und öffnest die Ansicht per Button.</p>
        <button
          type="button"
          className="add-deck-button add-summary-button"
          onClick={createNewSummary}
        >
          Neue Zusammenfassung
        </button>
        <label className="summary-search">
          <span>Suche</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Modul-Titel suchen..."
          />
        </label>
        <ul className="module-title-list">
          {visibleModules.map((moduleItem) => (
            <li key={moduleItem.id}>
              <div className="module-list-content">
                <span className="module-list-main">{moduleItem.name}</span>
                <span className="module-list-meta">
                  Datum: {moduleItem.uploadedAt} · Ersteller: {moduleItem.creator} · Thema:{' '}
                  {moduleItem.theme || '—'}
                </span>
                <span className="module-card-preview">
                  {moduleItem.intro.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                </span>
              </div>
              <div className="module-actions">
                <button
                  type="button"
                  className="module-icon-button"
                  onClick={() => openModuleView(moduleItem.id)}
                  title="Anschauen"
                  aria-label="Anschauen"
                >
                  👁
                </button>
                <button
                  type="button"
                  className="module-icon-button module-gear-button"
                  onClick={() => openEditView(moduleItem.id)}
                  title="Bearbeiten"
                  aria-label="Bearbeiten"
                >
                  ⚙
                </button>
                <button
                  type="button"
                  className="module-icon-button"
                  onClick={() => openPdfView(moduleItem.id)}
                  title="PDF Container"
                  aria-label="PDF Container"
                >
                  PDF
                </button>
                <button
                  type="button"
                  className="module-delete-button"
                  onClick={() => void deleteModule(moduleItem.id)}
                  title="Zusammenfassung löschen"
                  aria-label="Zusammenfassung löschen"
                >
                  {isDeletingModule === moduleItem.id ? '…' : '✕'}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {hasMoreModules && (
          <button
            type="button"
            className="load-more-button"
            onClick={() => void loadMoreModules()}
          >
            {isLoadingMore ? 'Lädt…' : 'Mehr Anzeigen'}
          </button>
        )}
      </div>

      {isDetailVisible && (
        <div className="summary-detail-container">
          {activePdfModule ? (
          <>
            <div className="module-view-header">
              <h2>{activePdfModule.name}</h2>
              <p className="module-view-tag">PDF-Container</p>
            </div>
            <p>Jedes Modul hat seinen eigenen PDF-Bereich mit Upload und Download.</p>
            <label className="pdf-upload-control">
              <span>PDF hochladen</span>
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={(event) => handlePdfUpload(activePdfModule.id, event)}
              />
            </label>
            <ul className="pdf-list">
              {(pdfMap[activePdfModule.id] ?? []).map((pdfItem) => (
                <li key={pdfItem.id}>
                  <div className="pdf-item-content">
                    <span className="pdf-item-title">{pdfItem.fileName}</span>
                    <span className="pdf-item-meta">
                      Datum: {pdfItem.uploadedAt} · Ersteller: {pdfItem.uploader}
                    </span>
                  </div>
                  <div className="pdf-actions">
                    <button
                      type="button"
                      className="pdf-action-button"
                      onClick={() => handlePdfDownload(activePdfModule.id, pdfItem)}
                      title="Download"
                      aria-label="Download"
                    >
                      ⬇
                    </button>
                    <button
                      type="button"
                      className="pdf-action-button secondary"
                      onClick={() => handlePdfDelete(activePdfModule.id, pdfItem.id)}
                      title="Entfernen"
                      aria-label="Entfernen"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="detail-action-row">
              <CloseIconButton onClick={() => setActivePdfModuleId(null)} />
            </div>
          </>
          ) : activeModule ? (
          <>
            <div className="module-view-header">
              <h2>{activeModule.name}</h2>
              <p className="module-view-tag">Thema: {activeModule.theme || '—'}</p>
            </div>
            <div className="module-glass-card">
              <h3>Einführung</h3>
              <div
                className="rich-text-output"
                dangerouslySetInnerHTML={{ __html: activeModule.intro }}
              />
            </div>
            <div className="module-glass-card">
              <h3>Wichtige Begriffe und Erklärungen</h3>
              <div
                className="rich-text-output"
                dangerouslySetInnerHTML={{ __html: activeModule.terms }}
              />
            </div>
            <div className="module-glass-card">
              <h3>Thematische Schwerpunkte</h3>
              <div
                className="rich-text-output"
                dangerouslySetInnerHTML={{ __html: activeModule.focus }}
              />
            </div>
            <div className="detail-action-row">
              <CloseIconButton onClick={() => setActiveModuleId(null)} />
            </div>
          </>
          ) : editingModule ? (
          <>
            <div className="module-view-header">
              {isEditEnabled ? (
                <div className="module-edit-head-fields">
                  <label className="module-head-field">
                    <span>Titel:</span>
                    <input
                      className="module-title-input"
                      value={editingModule.name}
                      onChange={(event) =>
                        updateEditingModuleField('name', event.target.value)
                      }
                    />
                  </label>
                  <label className="module-head-field">
                    <span>Thema:</span>
                    <input
                      className="module-title-input module-theme-input"
                      value={editingModule.theme}
                      onChange={(event) =>
                        updateEditingModuleField('theme', event.target.value)
                      }
                      placeholder="Thema"
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <h2>{editingModule.name}</h2>
                  <p className="module-view-tag">Thema: {editingModule.theme || '—'}</p>
                </div>
              )}
              <button
                type="button"
                className={`edit-toggle-button ${isEditEnabled ? 'is-active' : ''}`}
                onClick={() => setIsEditEnabled((current) => !current)}
                aria-label="Bearbeitungsmodus umschalten"
                title="Bearbeitungsmodus"
              >
                ⚙
              </button>
            </div>
            <div className="module-glass-card">
              <h3>Einführung</h3>
              {isEditEnabled ? (
                <RichTextEditor
                  value={editingModule.intro}
                  onChange={(next) => updateEditingModuleField('intro', next)}
                />
              ) : (
                <div
                  className="rich-text-output"
                  dangerouslySetInnerHTML={{ __html: editingModule.intro }}
                />
              )}
            </div>
            <div className="module-glass-card">
              <h3>Wichtige Begriffe und Erklärungen</h3>
              {isEditEnabled ? (
                <RichTextEditor
                  value={editingModule.terms}
                  onChange={(next) => updateEditingModuleField('terms', next)}
                />
              ) : (
                <div
                  className="rich-text-output"
                  dangerouslySetInnerHTML={{ __html: editingModule.terms }}
                />
              )}
            </div>
            <div className="module-glass-card">
              <h3>Thematische Schwerpunkte</h3>
              {isEditEnabled ? (
                <RichTextEditor
                  value={editingModule.focus}
                  onChange={(next) => updateEditingModuleField('focus', next)}
                />
              ) : (
                <div
                  className="rich-text-output"
                  dangerouslySetInnerHTML={{ __html: editingModule.focus }}
                />
              )}
            </div>
            {saveMessage && <p className="module-save-message">{saveMessage}</p>}
            <div className="detail-action-row">
              {isEditEnabled && (
                <button
                  type="button"
                  className="save-confirm-button"
                  onClick={() => void saveModuleToDatabase('manual')}
                >
                  {isSaving ? 'Speichert...' : 'Speichern'}
                </button>
              )}
              <CloseIconButton
                onClick={() => {
                  setEditingModuleId(null)
                  setIsEditEnabled(false)
                }}
              />
            </div>
            {savePopup && (
              <div className={`save-status-popup ${savePopup.type}`}>
                <p>{savePopup.text}</p>
                <button type="button" onClick={() => setSavePopup(null)}>
                  OK
                </button>
              </div>
            )}
          </>
          ) : null}
        </div>
      )}
    </section>
  )
}

function App() {
  const [sections, setSections] = useState<Section[]>([])
  const location = useLocation()

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${apiBase}/content/sections`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          return
        }
        const data = (await response.json()) as Section[]
        if (Array.isArray(data)) {
          setSections(data)
        }
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [])

  const sectionMap = useMemo(
    () =>
      sections.reduce<Record<string, Section>>((acc, section) => {
        acc[section.slug] = section
        return acc
      }, {}),
    [sections],
  )

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="header-main">
          <NavLink to="/start" className="brand" title="Zur Startseite">
            <img
              src={`${import.meta.env.BASE_URL}Logo.png`}
              alt="StudyCloud Logo"
              className="brand-logo"
            />
          </NavLink>
          <NavLink to="/mein-konto" className="entrance-link" title="Eingang zu Mein Konto">
            <img src={entranceIcon} alt="Eingang" className="entrance-icon" />
          </NavLink>
        </div>
      </header>

      <nav className="main-nav">
        {dropdownGroups.map((group) => (
          <div
            key={group.label}
            className={`nav-group ${
              group.entries.some((entry) => location.pathname.startsWith(entry.to)) ? 'active' : ''
            }`}
          >
            <span className="nav-group-label">{group.label}</span>
            <div className="nav-dropdown">
              {group.entries.map((entry) => (
                <NavLink key={entry.to} to={entry.to} className="nav-dropdown-link">
                  <span className="nav-dropdown-icon" aria-hidden="true">
                    {entry.icon}
                  </span>
                  <span className="nav-dropdown-text">{entry.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <main className="content-area">
        {location.pathname !== '/zusammenfassungen' &&
          location.pathname !== '/karteikarten' && (
          <section className="hero-panel">
            <HeroLoopVideo />
            <h1>ORGANIZE YOURSELF</h1>
            <p>Starte mit deinem roten Faden.</p>
          </section>
        )}

        <Routes>
          <Route path="/" element={<Navigate to="/start" replace />} />
          <Route path="/start" element={<StartPage />} />
          <Route path="/zusammenfassungen" element={<SummariesPage />} />
          <Route path="/karteikarten" element={<FlashcardsPage />} />
          <Route path="/spiele" element={<SpielePage />} />
          <Route path="/spiele/pulse" element={<SpielePage activeGameId="pulse" />} />
          <Route path="/spiele/realm-builder" element={<SpielePage activeGameId="realm-builder" />} />
          <Route path="/spiele/typing-arena" element={<SpielePage activeGameId="typing-arena" />} />
          <Route path="/mein-konto" element={<AccountPage section={sectionMap['mein-konto']} />} />
          <Route path="/mein-konto/anmelden" element={<AuthPage mode="anmelden" />} />
          <Route path="/mein-konto/registrieren" element={<AuthPage mode="registrieren" />} />
          <Route path="/chat" element={<Navigate to="/chat-forum" replace />} />
          <Route path="/gruppen" element={<Navigate to="/meine-gruppen" replace />} />
          {dropdownPlaceholderPages.map((page) => (
            <Route
              key={page.slug}
              path={`/${page.slug}`}
              element={<PlaceholderPage page={page} section={sectionMap[page.slug]} />}
            />
          ))}
        </Routes>
      </main>
    </div>
  )
}

export default App
