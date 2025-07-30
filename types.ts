import { Chat } from "@google/genai";

export interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
}

export interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  isLiked?: boolean;
  comments: Comment[];
  forumId?: string;
  isPinned?: boolean;
  isSaved?: boolean;
}

// Dentomedia - Forums & General
export interface UserProfile {
  id: number | string;
  name: string;
  avatar: string;
  email?: string;
  role?: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  description: string;
  privacy: 'public' | 'private';
  icon: React.ComponentType<any>;
  postCount?: number;
  memberCount?: number;
  members?: UserProfile[];
  isUserCreated?: boolean;
  tags?: string[];
}

// Dentomedia - Messaging
export interface ChatMessage {
    id: number;
    sender: 'You' | string; // 'You' for the current user
    avatar: string;
    text: string;
    timestamp: string;
}

export interface Conversation {
    id: number;
    participantName: string;
    participantAvatar: string;
    lastMessage: string;
    lastMessageTimestamp: string;
    messages: ChatMessage[];
}

// Dentomedia - Projects
export interface ProjectTask {
    id: number;
    text: string;
    completed: boolean;
}

export interface ProjectFile {
    id: number;
    name: string;
    type: 'document' | 'pdf' | 'image';
    size: string;
    timestamp: string;
    uploadedBy: UserProfile;
}

export interface ProjectDiscussionMessage {
    id: number;
    user: UserProfile;
    message: string;
    timestamp: string;
}

export interface Project {
    id: number;
    title: string;
    description: string;
    status: 'In Progress' | 'Completed' | 'Planning' | 'On Hold';
    privacy: 'public' | 'private';
    lead: UserProfile;
    members: UserProfile[];
    goals: string[];
    tasks: ProjectTask[];
    files: ProjectFile[];
    discussion: ProjectDiscussionMessage[];
}

// DentSync - Practice Management System
export interface Patient {
  id: number;
  name: string;
  avatar: string;
  dob: string;
  lastVisit: string;
  nextAppointment?: string;
  balance: number;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  date: string;
  time: string;
  procedure: string;
  doctor: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'Scheduled' | 'No Show';
}

export interface Treatment {
  id: number;
  patientId: number;
  date: string;
  tooth?: string;
  procedure: string;
  notes: string;
  status: 'Planned' | 'In Progress' | 'Completed';
}

export interface FinancialRecord {
  id: number;
  patientId: number;
  date: string;
  description: string;
  charge: number;
  payment: number;
}


export interface NewsArticle {
  title: string;
  summary: string;
  category: string;
  url: string;
}

export interface NewsAnalysis {
    keyTakeaways: string[];
    simplifiedExplanation: string;
    furtherReading: {
        title: string;
        url: string;
    }[];
    error?: string;
}

export interface Job {
  title: string;
  company: string;
  location: string;
  description: string;
  type: string;
  url: string;
}

export interface Event {
  id: string; // A unique identifier, can be the URL if unique
  title: string;
  date: string; // e.g., "October 15-17, 2024"
  location: string; // "Online" or "City, Country"
  description: string;
  type: 'CDE Program' | 'Workshop' | 'Conference' | 'Webinar' | 'Other';
  url: string; // Link to the event page
}

export interface DirectoryEntry {
  id: number;
  name: string;
  specialty: string;
  location: string;
  contact: string;
  type: 'Dentist' | 'Technician' | 'Supplier' | 'Student';
}

// DentRadar - Public
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  photo: string;
  bio: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  lat: number;
  lng: number;
  rating: number;
  services: string[];
  photos: string[];
  doctors: Doctor[];
  reviews: Review[];
  isOpen?: boolean;
}

export interface ReviewSummary {
  overallSentiment: string;
  praises: string[];
  complaints: string[];
  error?: string;
}


export interface Question {
    id: string;
    questionText: string;
    modelAnswer: string; // For essays
    subject: string;
    examType: 'Internal' | 'Final University' | 'NEET MDS';
    year: number;
    college: string;
    university: string;
    contributor: string;

    // Fields for Mock Tests
    questionType: 'Essay' | 'MCQ';
    options?: string[]; // For MCQs
    answer?: string; // For MCQs, the correct option text
    
    error?: string;
}

// DentPrepHub - AI Viva Session
export interface VivaQuestion {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    isFinalQuestion?: boolean;
    error?: string;
}

export interface EvaluationResult {
    isCorrect: boolean;
    feedback: string;
    score: number;
    error?: string;
}


export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface DentalAnalysis {
  disclaimer: string;
  observations: string[];
  areasForAttention: string[];
  error?: string;
}

export interface OralLesionAnalysis {
  riskLevel: 'Low' | 'Medium' | 'High';
  observations: string[];
  recommendation: string;
  disclaimer: string;
  error?: string;
}

export interface SavedScreening {
  id: string;
  date: string;
  imageSrc: string;
  analysis: OralLesionAnalysis;
  notes?: string;
}

export interface ParsedSearchResult {
  summary: string;
  detailedAnswer: string;
  sources: GroundingChunk[];
}

export interface BookmarkedSearch {
  id: string;
  timestamp: string;
  query: string;
  result: ParsedSearchResult;
  notes: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Consumables' | 'Equipment' | 'Instruments' | 'Restoratives';
  brand: string;
  rating: number;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ProductComparison {
    comparison: {
        productName: string;
        summary: string;
        pros: string[];
        cons: string[];
    }[];
    recommendation: string;
    error?: string;
}


// Denta-versity AI Learning Hub
export interface DentaversityQuizQuestion {
  question: string;
  options: string[];
  answer: string;
}
export interface DentaversityModule {
  id: string;
  timestamp: string;
  title: string;
  keyConcepts: string[];
  detailedExplanations: {
    concept: string;
    explanation: string;
  }[];
  clinicalSignificance: string;
  quiz: DentaversityQuizQuestion[];
  imageUrl?: string;
  isBookmarked?: boolean;
  relatedTopics?: string[];
  error?: string;
}

// DentaHunt AI Resume Helper
export interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  error?: string;
}

// Clinical Diary
export interface DiaryEntry {
  id: number;
  date: string;
  title: string;
  notes: string;
  image?: string;
}

// DentaLab Connect - Dental Lab Integration
export interface DentalLab {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
}

export interface LabFile {
  id: string;
  name: string;
  type: string;
  size: number;
  fileObject?: File; // To hold the file for upload simulation
}

export type CaseStatus = 'Submitted' | 'Pickup Scheduled' | 'In Transit' | 'In Lab' | 'Shipped' | 'Completed' | 'On Hold';

export interface CaseTrackingEvent {
  status: CaseStatus;
  date: string;
  notes?: string;
}

export interface LabCase {
  id: string;
  patientName: string;
  caseType: string;
  shade: string;
  dueDate: string;
  labId: string;
  labName: string; // denormalized for easy display
  status: CaseStatus;
  trackingHistory: CaseTrackingEvent[];
  notes: string;
  files: LabFile[];
  createdAt: string;
}


// --- NEXT LEVEL FEATURES ---

// Global Notifications
export interface Notification {
  id: number;
  type: 'new_message' | 'project_update' | 'forum_reply' | 'system_alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// DentaMart Order History
export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
}

// AI Symptom Checker
export interface SymptomAnalysis {
  possibleConditions: { name: string; description: string; }[];
  recommendedActions: string[];
  urgency: 'Non-urgent' | 'See a dentist soon' | 'Urgent dental care recommended';
  disclaimer: string;
  followUpQuestion?: string;
  isComplete?: boolean;
  error?: string;
}

// Dental Myth Busters
export interface MythBusterAnalysis {
    verdict: 'Fact' | 'Fiction' | 'It\'s Complicated';
    explanation: string;
    myth: string;
    sources?: GroundingChunk[];
    error?: string;
}

// ProcedurePedia
export interface ProcedureInfo {
    title: string;
    description: string;
    procedureSteps: string[];
    postOpCare: string[];
    error?: string;
}

// Insurance Decoder
export interface InsuranceBenefit {
    category: 'Preventative' | 'Basic' | 'Major' | 'Orthodontics' | 'Other';
    coveragePercentage: number;
    notes?: string;
}
export interface InsurancePlanSummary {
    planName: string;
    annualMaximum: number;
    deductible: number;
    benefits: InsuranceBenefit[];
    disclaimer: string;
    error?: string;
}

// DentaScribe - Manuscript Writer
export interface ManuscriptSection {
  title: string;
  content: string;
}

export interface Manuscript {
  title: string;
  topic: string;
  sections: Record<string, ManuscriptSection>;
}

export interface ParaphraseResult {
  paraphrasedText: string;
  error?: string;
}

export interface JournalSuggestion {
  journalName: string;
  scope: string;
  relevance: string;
  impactFactor: string;
  url: string;
}

export interface JournalFinderResult {
  suggestions: JournalSuggestion[];
  error?: string;
}

// DentaScribe - Plagiarism Checker
export interface PlagiarizedPassage {
  text: string;
  source: string;
  sourceTitle: string;
}

export interface PlagiarismResult {
  plagiarismScore: number;
  summary: string;
  plagiarizedPassages: PlagiarizedPassage[];
  error?: string;
}

// DentaVault - My Study Hub
export type VaultItemType = 'folder' | 'note' | 'file' | 'link';

export type VaultItem = VaultFolder | VaultNote | VaultFile | VaultLink;

export interface VaultBase {
    id: string;
    name: string;
    type: VaultItemType;
    parentId: string; // 'root' or another folder's ID
    tags?: string[];
}

export interface VaultFolder extends VaultBase {
    type: 'folder';
    children: string[]; // Array of item IDs
}

export interface VaultNote extends VaultBase {
    type: 'note';
    content: string;
    lastModified: string;
}

export interface VaultFile extends VaultBase {
    type: 'file';
    fileType: string; // e.g., 'application/pdf'
    size: number; // in bytes
    previewUrl?: string; // For images, this will be a base64 data URL
    downloadUrl?: string; // For all files, a base64 data URL for downloading
    lastModified: string;
}

export interface VaultLink extends VaultBase {
    type: 'link';
    url: string;
}

export interface NoteSummary {
    summary: string;
    keyPoints: string[];
    quizQuestions: {
        question: string;
        options: string[];
        answer: string;
    }[];
    error?: string;
}

export interface Flashcard {
    question: string;
    answer: string;
}

export interface FlashcardResult {
    flashcards: Flashcard[];
    error?: string;
}


// Trauma Care Companion
export interface TraumaCareGuide {
  urgency: 'Low' | 'Moderate' | 'High';
  firstAidSteps: string[];
  whatToAvoid: string[];
  whenToSeeDentist: string;
  error?: string;
}

// --- WOW FACTOR FEATURES ---
export type AiPersona = 'Friendly Colleague' | 'Seasoned Professor' | 'Succinct Summarizer' | 'Default';

export interface ForumTrendAnalysis {
    trendingTopics: {
        topic: string;
        reason: string;
    }[];
    sentiment: {
        overall: string;
        details: string;
    };
    error?: string;
}

export interface ProjectAssistance {
    suggestedNextSteps: string[];
    potentialRisks: string[];
    summary: string;
    error?: string;
}

export interface InterviewCoachSession {
    chat: Chat;
    initialQuestion: string;
}

export interface TripItinerary {
    destination: string;
    suggestions: {
        category: 'Flights' | 'Hotels' | 'Attractions';
        details: string;
    }[];
    error?: string;
}

export interface ConnectionSuggestion {
    suggestions: {
        entry: DirectoryEntry;
        reason: string;
    }[];
    error?: string;
}

export interface CartAnalysis {
    complementaryProducts: { name: string; reason: string }[];
    redundancies: { products: string[]; reason: string }[];
    costSavingAlternatives: { original: string; alternative: string; reason: string }[];
    summary: string;
    error?: string;
}

export interface LearningPath {
  goal: string;
  steps: {
    title: string;
    description: string;
    topicToGenerate: string; // The topic to pass to Dentaversity
  }[];
  error?: string;
}

export interface Mnemonic {
    mnemonic: string;
    explanation: string;
    error?: string;
}

export interface DentalComparisonAnalysis {
  disclaimer: string;
  changes: {
    area: string;
    observation: string;
  }[];
  recommendation: string;
  error?: string;
}

// DentaAI Voice Assistant
export interface DentaAiCommandResponse {
    responseText: string;
    action?: 'navigate' | 'summarize' | 'inform' | 'update_memory';
    target?: string;
    error?: string;
}

// Patient Companion App
export interface BrushingLogEntry {
  date: string; // 'YYYY-MM-DD'
  morning: boolean;
  night: boolean;
}

export interface PatientReminder {
  id: string;
  title: string;
  time: string;
  type: 'appointment' | 'medication' | 'custom';
  completed: boolean;
}

export interface HealthReport {
  id: string;
  title: string;
  date: string;
  url: string;
}

// --- ENTIRELY NEW FEATURES ---

// DentaSim - AI Tutor & Case Simulator
export interface CaseSimulation {
    patientHistory: string;
    symptoms: string[];
    radiographicFindings: string;
    error?: string;
}

export interface CaseEvaluation {
    positiveFeedback: string[];
    areasForImprovement: string[];
    suggestedPlan: string;
    finalAssessment: string;
    error?: string;
}

// CDE-AI - CDE Planner & Content Generator
export interface CDECourse {
    id: string;
    title: string;
    provider: string;
    credits: number;
    url: string;
    date: string;
}

export interface CdeCreditLog {
    id: string;
    courseTitle: string;
    creditsEarned: number;
    completionDate: string;
}

export interface PresentationSlide {
    title: string;
    points: string[];
    imageUrl?: string;
    presenterNotes?: string;
}

export interface PresentationOutline {
    mainTitle: string;
    slides: PresentationSlide[];
    error?: string;
}

// DentaJourney - My Dental Wellness Journey
export interface JourneyTask {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
}

export interface JourneyPhase {
    title: string;
    duration: string; // e.g., "Week 1"
    focus: string;
    tasks: JourneyTask[];
}

export interface WellnessJourney {
    id: string;
    goal: string;
    introductoryMessage: string;
    phases: JourneyPhase[];
    finalMessage: string;
    error?: string;
}