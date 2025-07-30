

import { GoogleGenAI, GenerateContentResponse, Type, Part, Chat, Content } from "@google/genai";
import { DentalAnalysis, NewsArticle, Job, NewsAnalysis, FinancialRecord, DentaversityModule, ResumeAnalysis, Question, EvaluationResult, Event, SymptomAnalysis, MythBusterAnalysis, Post, ProductComparison, Product, DirectoryEntry, AiPersona, ForumTrendAnalysis, ProjectAssistance, TripItinerary, ConnectionSuggestion, CartAnalysis, LearningPath, DentalComparisonAnalysis, Mnemonic, GroundingChunk, UserProfile, CartItem, ProcedureInfo, InsurancePlanSummary, OralLesionAnalysis, Project, ParaphraseResult, JournalFinderResult, TraumaCareGuide, DentaAiCommandResponse, CaseSimulation, CaseEvaluation, CDECourse, PresentationOutline, WellnessJourney, InterviewCoachSession, JourneyTask, JourneyPhase, VivaQuestion, Review, ReviewSummary, PlagiarismResult, NoteSummary, FlashcardResult } from '../types';

// Safely access the API key to prevent crashes in browser environments
// where `process` is not defined.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the AI client only if the API key is available.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

/**
 * Creates a standard error to be thrown when the AI service is not configured.
 * @returns {Error}
 */
const createApiNotConfiguredError = () => new Error("The AI service is not configured. Please ensure the API_KEY environment variable is set up correctly for the deployment.");


const getSystemInstructionForPersona = (persona: AiPersona): string => {
    switch (persona) {
        case 'Friendly Colleague':
            return 'You are DentForge, an AI assistant for the dental community. Your persona is a friendly, approachable colleague. Use a conversational and encouraging tone. Offer collaborative suggestions and share insights as if you were talking to a peer.';
        case 'Seasoned Professor':
            return 'You are DentForge, an AI assistant for the dental community. Your persona is a seasoned dental school professor. Provide detailed, structured, and evidence-based answers. Be formal, authoritative, and educational. Cite principles and concepts where applicable.';
        case 'Succinct Summarizer':
            return 'You are DentForge, an AI assistant for the dental community. Your persona is a succinct summarizer. Get straight to the point. Provide answers in the form of bullet points or short, concise paragraphs. Avoid conversational fluff.';
        default:
            return 'You are DentForge, a specialized AI assistant for the dental community. Provide accurate, detailed, and professional information related to dentistry. Your audience consists of dentists, dental students, and technicians. Be clear, concise, and helpful.';
    }
};

const cleanJsonString = (jsonString: string): string => {
    return jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
};

const generateJsonResponse = async <T>(prompt: string, schema: any, model: 'gemini-2.5-flash' = 'gemini-2.5-flash'): Promise<T> => {
    if (!ai) throw createApiNotConfiguredError();
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const cleanedJson = cleanJsonString(response.text);
        return JSON.parse(cleanedJson) as T;
    } catch (e: any) {
        console.error("Error generating JSON response:", e);
        const errorResult: any = { error: "Failed to process the AI request." };
        if (e.message) {
            errorResult.details = e.message;
        }
        return errorResult as T;
    }
};


// Dentforge
export const getAiForgeResponse = async (history: Content[], prompt: string, persona: AiPersona): Promise<string> => {
    if (!ai) throw createApiNotConfiguredError();
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: getSystemInstructionForPersona(persona) },
        history,
    });
    const response = await chat.sendMessage({ message: prompt });
    return response.text;
};

// Dentafeed
export const fetchAndSummarizeDentalNews = async (): Promise<NewsArticle[]> => {
    const prompt = "Generate a list of 5 recent and diverse dental news articles. For each, provide a title, a short summary (2-3 sentences), a relevant category (e.g., Technology, Research, Practice Management, Education), and a placeholder URL.";
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                category: { type: Type.STRING },
                url: { type: Type.STRING },
            },
            required: ['title', 'summary', 'category', 'url'],
        },
    };
    return generateJsonResponse<NewsArticle[]>(prompt, schema);
};

export const getAiDeepDive = async (article: NewsArticle): Promise<NewsAnalysis> => {
    const prompt = `Provide a deep-dive analysis of the following dental news article:\n\nTitle: ${article.title}\nSummary: ${article.summary}\n\nYour analysis should include key takeaways, a simplified explanation for students, and suggestions for further reading with placeholder URLs.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            simplifiedExplanation: { type: Type.STRING },
            furtherReading: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } }, required: ['title', 'url'] } },
        },
        required: ['keyTakeaways', 'simplifiedExplanation', 'furtherReading'],
    };
    return generateJsonResponse<NewsAnalysis>(prompt, schema);
};

// Dentomedia
export const generateSocialPost = async (topic: string): Promise<string> => {
    if (!ai) throw createApiNotConfiguredError();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a professional and engaging social media post for a dental platform about the following topic: "${topic}". Include relevant hashtags. The post should be concise and informative.`
    });
    return response.text;
};

export const suggestCommentReplies = async (postContent: string): Promise<string[]> => {
    const prompt = `Given the following social media post by a dental professional, suggest 3 distinct, insightful, and professional comment replies:\n\nPost: "${postContent}"`;
    const schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };
    return generateJsonResponse<string[]>(prompt, schema);
};

export const getProjectAssistance = async (project: Project): Promise<ProjectAssistance> => {
    const prompt = `Analyze the following dental research/outreach project and provide assistance. Project details:\n\nTitle: ${project.title}\nDescription: ${project.description}\nStatus: ${project.status}\nGoals: ${project.goals.join(', ')}\nTasks: ${project.tasks.map(t => `${t.text} (${t.completed ? 'Done' : 'Pending'})`).join(', ')}\n\nProvide a brief summary of the project's current state, suggest the next logical steps, and identify potential risks.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            suggestedNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            potentialRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['summary', 'suggestedNextSteps', 'potentialRisks'],
    };
    return generateJsonResponse<ProjectAssistance>(prompt, schema);
};

// Dentahunt
export const findDentalJobs = async (role: string, location: string, type: string): Promise<Job[]> => {
    const prompt = `Generate a list of 5 realistic, mock dental job openings for a "${role}" in "${location}" of type "${type}". Include a title, company, location, a brief description, type, and a placeholder URL.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                location: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING },
                url: { type: Type.STRING },
            },
            required: ['title', 'company', 'location', 'description', 'type', 'url'],
        },
    };
    return generateJsonResponse<Job[]>(prompt, schema);
};

export const analyzeResume = async (resume: string, jobDesc: string): Promise<ResumeAnalysis> => {
    const prompt = `Analyze the following resume against the provided job description for a dental position. Identify key strengths, weaknesses, and actionable suggestions for improvement.\n\nResume:\n${resume}\n\nJob Description:\n${jobDesc}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['strengths', 'weaknesses', 'suggestions'],
    };
    return generateJsonResponse<ResumeAnalysis>(prompt, schema);
};

export const generateImprovedResume = async (resume: string, jobDesc: string, analysis: ResumeAnalysis): Promise<string> => {
    if (!ai) throw createApiNotConfiguredError();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the original resume, the job description, and the provided analysis, generate an improved, concise version of the resume text. Focus on incorporating the suggestions and highlighting the strengths.\n\nOriginal Resume:\n${resume}\n\nJob Description:\n${jobDesc}\n\nAnalysis:\nStrengths: ${analysis.strengths.join(', ')}\nWeaknesses: ${analysis.weaknesses.join(', ')}\nSuggestions: ${analysis.suggestions.join(', ')}`
    });
    return response.text;
};

export const startInterviewSession = async (jobDesc: string): Promise<InterviewCoachSession> => {
    if (!ai) throw createApiNotConfiguredError();
    const systemInstruction = `You are an AI interview coach for dental professionals. You will conduct a mock interview for the job described by the user. Ask one question at a time, starting with a common opening question. Keep your questions relevant to the dental field and the specific job description. Provide brief feedback after a few of the user's answers.`;
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        history: [{ role: 'user', parts: [{ text: `Here is the job description: ${jobDesc}` }] }]
    });
    const response = await chat.sendMessage({ message: "Let's start the interview." });
    return { chat, initialQuestion: response.text };
};

export const planTripForInterview = async (location: string): Promise<TripItinerary> => {
    const prompt = `Generate a brief travel itinerary for a job interview in "${location}". Suggest one option for flights, one for hotels, and two local attractions. Provide details in a concise format.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            destination: { type: Type.STRING },
            suggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, enum: ['Flights', 'Hotels', 'Attractions'] },
                        details: { type: Type.STRING },
                    },
                    required: ['category', 'details'],
                }
            }
        },
        required: ['destination', 'suggestions'],
    };
    return generateJsonResponse<TripItinerary>(prompt, schema);
};

// Dentaround
export const findDentalEvents = async (query: string, eventType: string): Promise<Event[]> => {
    const prompt = `Generate a list of 5 realistic, mock dental events based on the query: "${query}". If a type is specified ("${eventType}"), prioritize that. Include a unique ID (the URL is fine), title, date string, location, brief description, type, and a placeholder URL.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                date: { type: Type.STRING },
                location: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['CDE Program', 'Workshop', 'Conference', 'Webinar', 'Other'] },
                url: { type: Type.STRING },
            },
            required: ['id', 'title', 'date', 'location', 'description', 'type', 'url'],
        },
    };
    return generateJsonResponse<Event[]>(prompt, schema);
};

// Dentradar
export const searchDirectory = async (query: string, directory: DirectoryEntry[]): Promise<DirectoryEntry[]> => {
    const prompt = `Given the following dental professional directory, perform a semantic search based on the user's query and return only the matching entries from the original list. Do not invent new entries.\n\nQuery: "${query}"\n\nDirectory:\n${JSON.stringify(directory, null, 2)}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.INTEGER },
                name: { type: Type.STRING },
                specialty: { type: Type.STRING },
                location: { type: Type.STRING },
                contact: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['Dentist', 'Technician', 'Supplier', 'Student'] },
            },
            required: ['id', 'name', 'specialty', 'location', 'contact', 'type'],
        },
    };
    return generateJsonResponse<DirectoryEntry[]>(prompt, schema);
};

export const suggestConnections = async (userProfile: UserProfile, directory: DirectoryEntry[]): Promise<ConnectionSuggestion> => {
    const prompt = `Based on the user's profile, suggest 3 relevant connections from the provided directory. Provide a brief reason for each suggestion.\n\nUser Profile:\nRole: ${userProfile.role}\n\nDirectory:\n${JSON.stringify(directory, null, 2)}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            suggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        entry: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.INTEGER }, name: { type: Type.STRING }, specialty: { type: Type.STRING }, location: { type: Type.STRING }, contact: { type: Type.STRING }, type: { type: Type.STRING },
                            },
                        },
                        reason: { type: Type.STRING },
                    },
                    required: ['entry', 'reason'],
                }
            }
        },
        required: ['suggestions'],
    };
    return generateJsonResponse<ConnectionSuggestion>(prompt, schema);
};

export const summarizeClinicReviews = async (reviews: Review[]): Promise<ReviewSummary> => {
    const prompt = `Analyze the following patient reviews for a dental clinic. Provide a brief overall sentiment, a list of 2-3 common praises, and a list of 2-3 common complaints.

    Reviews:
    ${JSON.stringify(reviews.map(r => r.comment))}`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            overallSentiment: { type: Type.STRING },
            praises: { type: Type.ARRAY, items: { type: Type.STRING } },
            complaints: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['overallSentiment', 'praises', 'complaints'],
    };

    return generateJsonResponse<ReviewSummary>(prompt, schema);
};

// AiScanner & TeleDentAI
export const analyzeDentalImage = async (base64Image: string, mimeType: string): Promise<DentalAnalysis> => {
    if (!ai) throw createApiNotConfiguredError();
    const imagePart: Part = { inlineData: { data: base64Image, mimeType } };
    const prompt = "Analyze this image of teeth. Provide general observations and identify specific areas for attention (like potential cavities, plaque, or inflammation). This is for informational purposes and is not a diagnosis. Start with a clear disclaimer.";
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        disclaimer: { type: Type.STRING },
                        observations: { type: Type.ARRAY, items: { type: Type.STRING } },
                        areasForAttention: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['disclaimer', 'observations', 'areasForAttention'],
                }
            }
        });
        return JSON.parse(cleanJsonString(response.text)) as DentalAnalysis;
    } catch (e) {
        return { error: 'Failed to analyze image.', disclaimer: '', observations: [], areasForAttention: [] };
    }
};

// DentalSearchEngine
export const searchDentalLiterature = async (query: string, dateRange: string, resourceType: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
    if (!ai) throw createApiNotConfiguredError();
    const fullQuery = `Search dental literature for "${query}". Filters: Date Range: ${dateRange || 'any'}, Resource Type: ${resourceType || 'any'}. Provide a concise summary and then a detailed answer based on the search results. Structure the response with "### Summary" and "### Detailed Answer" headings.`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullQuery,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    return { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

// DentPrepHub & Dentaversity
export const generateMnemonic = async (text: string): Promise<Mnemonic> => {
    const prompt = `Create a clever and memorable mnemonic for the following dental concept or list, and provide a brief explanation of how it works:\n\n${text}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            mnemonic: { type: Type.STRING },
            explanation: { type: Type.STRING },
        },
        required: ['mnemonic', 'explanation'],
    };
    return generateJsonResponse<Mnemonic>(prompt, schema);
};

export const generateExamTipsForQuestion = async (question: string, subject: string): Promise<string[]> => {
    const prompt = `For the exam question "${question}" in the subject of "${subject}", provide 3-4 concise, actionable study tips or key points to remember for crafting a high-scoring answer.`;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    return generateJsonResponse<string[]>(prompt, schema);
};

export const evaluatePrepAnswer = async (question: Question, userAnswer: string): Promise<EvaluationResult> => {
    const prompt = `Evaluate the user's answer for the following dental exam question. Compare it against the model answer, provide constructive feedback, and give a score out of 10.\n\nQuestion: ${question.questionText}\n\nModel Answer: ${question.modelAnswer}\n\nUser's Answer: ${userAnswer}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            isCorrect: { type: Type.BOOLEAN }, // This is a simplification for the schema
            feedback: { type: Type.STRING },
            score: { type: Type.INTEGER },
        },
        required: ['feedback', 'score'],
    };
    return generateJsonResponse<EvaluationResult>(prompt, schema);
};

export const createVivaChat = (topic: string): Chat => {
    if (!ai) throw createApiNotConfiguredError();

    const systemInstruction = `You are an expert dental professor conducting a continuous viva voce examination in the form of multiple-choice questions (MCQs). The user has chosen the topic: "${topic}".
Your task is to test their knowledge by asking a series of relevant MCQs, one at a time.

RULES:
1. Your response MUST ALWAYS be a single JSON object.
2. For the first question, and every subsequent question, the JSON object MUST strictly follow this schema: { "question": "string", "options": ["string", "string", "string", "string"], "answer": "string", "explanation": "string" }.
3. The 'answer' field must be one of the strings from the 'options' array.
4. The 'explanation' should clarify why the correct answer is right, especially in the context of the user's previous answer.
5. After the user answers a question, your next response should contain the JSON for the *next* question, with an explanation that gives feedback on their previous answer.
6. If the user's response is "stop", "end", "that's enough", or something similar, your response must be a JSON object with this schema: { "isFinalQuestion": true, "explanation": "A concluding remark about the session." }
`;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    isFinalQuestion: { type: Type.BOOLEAN },
                },
                required: ['explanation']
            }
        }
    });
};


// Dentaversity
export const getDentaversityModule = async (topic: string): Promise<Omit<DentaversityModule, 'id' | 'timestamp' | 'imageUrl' | 'isBookmarked'>> => {
    const prompt = `Generate a detailed, AI-powered learning module for a dental student on the topic: "${topic}". The module should include: key concepts (as a list), detailed explanations for each concept, its clinical significance, 2-3 related topics for further study, and a 3-question multiple-choice quiz with 4 options each and a specified answer.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            detailedExplanations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { concept: { type: Type.STRING }, explanation: { type: Type.STRING } } } },
            clinicalSignificance: { type: Type.STRING },
            relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
            quiz: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'answer'],
                }
            },
        },
        required: ['title', 'keyConcepts', 'detailedExplanations', 'clinicalSignificance', 'quiz'],
    };
    return generateJsonResponse<Omit<DentaversityModule, 'id' | 'timestamp' | 'imageUrl' | 'isBookmarked'>>(prompt, schema);
};

export const generateDentaversityImage = async (topic: string): Promise<string> => {
    if (!ai) throw createApiNotConfiguredError();
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `A clear, professional, educational medical illustration for a dental textbook explaining the concept of "${topic}". Stylized, clean lines, clear labels if appropriate.`,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
    });
    return response.generatedImages[0].image.imageBytes;
};

export const generateLearningPath = async (goal: string): Promise<LearningPath> => {
    const prompt = `Create a structured, step-by-step learning path for a dental student with the goal: "${goal}". Provide 3-5 high-level steps. Each step should have a title, a brief description, and a specific topic string that can be used to generate a Dentaversity module.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            goal: { type: Type.STRING },
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        topicToGenerate: { type: Type.STRING },
                    },
                    required: ['title', 'description', 'topicToGenerate'],
                }
            }
        },
        required: ['goal', 'steps'],
    };
    return generateJsonResponse<LearningPath>(prompt, schema);
};

// DentSync (Patient Management)
export const generatePatientCommunication = async (type: 'reminder' | 'post-op', patientName: string): Promise<string> => {
    if (!ai) throw createApiNotConfiguredError();
    const prompt = type === 'reminder'
        ? `Generate a friendly and professional appointment reminder message for a patient named ${patientName}.`
        : `Generate a clear and concise post-operative care instruction message for a patient named ${patientName} who just had a dental procedure.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const generateSoapNote = async (brief: string): Promise<string> => {
    if (!ai) throw createApiNotConfiguredError();
    const prompt = `Expand the following brief clinical note into a standard SOAP note format (Subjective, Objective, Assessment, Plan).\n\nBrief note: "${brief}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const analyzeFinancials = async (transactions: FinancialRecord[]): Promise<{ summary: string; insights: string[]; recommendations: string[] }> => {
    const prompt = `Analyze the following list of financial transactions for a dental clinic. Provide a brief summary, 2-3 key insights, and 2-3 actionable recommendations.\n\nTransactions:\n${JSON.stringify(transactions)}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['summary', 'insights', 'recommendations'],
    };
    return generateJsonResponse<{ summary: string; insights: string[]; recommendations: string[] }>(prompt, schema);
};

// DentaMart
export const compareProducts = async (products: Product[]): Promise<ProductComparison> => {
    const prompt = `Compare the following dental products. For each, provide a summary, 2-3 pros, and 2-3 cons. Then provide a final recommendation based on the comparison.\n\nProducts:\n${JSON.stringify(products.map(p => ({ name: p.name, description: p.description, price: p.price })))}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            comparison: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        productName: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['productName', 'summary', 'pros', 'cons'],
                },
            },
            recommendation: { type: Type.STRING },
        },
        required: ['comparison', 'recommendation'],
    };
    return generateJsonResponse<ProductComparison>(prompt, schema);
};

export const reviewCart = async (cart: CartItem[]): Promise<CartAnalysis> => {
    const prompt = `Review the following shopping cart for a dental professional. Provide a summary, suggest complementary products, identify potential redundancies, and suggest any cost-saving alternatives.\n\nCart:\n${JSON.stringify(cart.map(c => ({ name: c.name, quantity: c.quantity })))}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            complementaryProducts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } } } },
            redundancies: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { products: { type: Type.ARRAY, items: { type: Type.STRING } }, reason: { type: Type.STRING } } } },
            costSavingAlternatives: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, alternative: { type: Type.STRING }, reason: { type: Type.STRING } } } },
        },
        required: ['summary'],
    };
    return generateJsonResponse<CartAnalysis>(prompt, schema);
};

// DentaLabConnect
export const analyzeLabCaseNotes = async (notes: string): Promise<{ suggestions: string[]; flags: string[] }> => {
    const prompt = `Analyze the following dental lab case notes. Provide suggestions to improve clarity for the lab technician and flag any potential ambiguities or missing critical information.\n\nNotes: "${notes}"`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            flags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['suggestions', 'flags'],
    };
    return generateJsonResponse<{ suggestions: string[]; flags: string[] }>(prompt, schema);
};

// SymptomChecker
export const analyzeSymptoms = async (symptoms: string, history: Content[]): Promise<SymptomAnalysis> => {
    if (!ai) throw createApiNotConfiguredError();
    const systemInstruction = "You are a helpful AI dental symptom checker. Your goal is to gather information from the user, then provide potential conditions, recommended actions, and an urgency level. You are not a doctor and must always include a disclaimer. Ask clarifying questions one at a time until you have enough information to provide a final analysis. When you have enough information, set 'isComplete' to true and do not ask a follow-up question.";
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    possibleConditions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } } },
                    recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    urgency: { type: Type.STRING, enum: ['Non-urgent', 'See a dentist soon', 'Urgent dental care recommended'] },
                    disclaimer: { type: Type.STRING },
                    followUpQuestion: { type: Type.STRING },
                    isComplete: { type: Type.BOOLEAN },
                },
                required: ['disclaimer'],
            }
        },
        history,
    });
    const response = await chat.sendMessage({ message: symptoms });
    return JSON.parse(cleanJsonString(response.text)) as SymptomAnalysis;
};

// MythBusters
export const bustDentalMyth = async (myth: string): Promise<MythBusterAnalysis> => {
    if (!ai) throw createApiNotConfiguredError();
    const prompt = `Investigate the dental myth: "${myth}". Using your knowledge and search results, determine if it's a Fact, Fiction, or It's Complicated. Provide a clear explanation. Your entire response must be a single JSON object with the following structure: {"myth": "string", "verdict": "Fact" | "Fiction" | "It's Complicated", "explanation": "string"}.`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });

    try {
        const analysis = JSON.parse(cleanJsonString(response.text)) as MythBusterAnalysis;
        analysis.sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return analysis;
    } catch (e: any) {
        console.error("Failed to parse JSON from bustDentalMyth:", e, "Response text:", response.text);
        return { 
            myth: myth,
            verdict: "It's Complicated",
            explanation: "The AI response could not be parsed as valid JSON. The service might be busy.",
            error: "Could not parse AI response.",
            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        };
    }
};

// ProcedurePedia
export const getProcedureInformation = async (procedureName: string): Promise<ProcedureInfo> => {
    const prompt = `Provide a simple, patient-friendly explanation of the dental procedure: "${procedureName}". Include a general description, a list of typical procedure steps, and a list of common post-operative care instructions.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            procedureSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            postOpCare: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['title', 'description', 'procedureSteps', 'postOpCare'],
    };
    return generateJsonResponse<ProcedureInfo>(prompt, schema);
};

export const startProcedureChat = (procedureName: string): Chat => {
    if (!ai) throw createApiNotConfiguredError();
    const systemInstruction = `You are a helpful AI assistant explaining the dental procedure "${procedureName}" to a patient. Answer their follow-up questions clearly and concisely. Do not provide medical advice.`;
    return ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
};

// InsuranceDecoder
export const decodeInsurancePlan = async (base64Image: string, mimeType: string): Promise<InsurancePlanSummary> => {
    if (!ai) throw createApiNotConfiguredError();
    const imagePart: Part = { inlineData: { data: base64Image, mimeType } };
    const prompt = "Analyze the provided image of a dental insurance plan summary. Extract the plan name, annual maximum, deductible, and a list of benefits with their category and coverage percentage. Provide a disclaimer that this is an AI interpretation and the user should verify with their provider.";
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        planName: { type: Type.STRING },
                        annualMaximum: { type: Type.NUMBER },
                        deductible: { type: Type.NUMBER },
                        benefits: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING, enum: ['Preventative', 'Basic', 'Major', 'Orthodontics', 'Other'] },
                                    coveragePercentage: { type: Type.NUMBER },
                                    notes: { type: Type.STRING },
                                },
                                required: ['category', 'coveragePercentage'],
                            }
                        },
                        disclaimer: { type: Type.STRING },
                    },
                    required: ['planName', 'annualMaximum', 'deductible', 'benefits', 'disclaimer'],
                }
            }
        });
        return JSON.parse(cleanJsonString(response.text)) as InsurancePlanSummary;
    } catch (e) {
        return { error: 'Failed to decode insurance plan from image.', planName: '', annualMaximum: 0, deductible: 0, benefits: [], disclaimer: '' };
    }
};

// OralScreen
export const analyzeOralLesion = async (base64Image: string, mimeType: string): Promise<OralLesionAnalysis> => {
    if (!ai) throw createApiNotConfiguredError();
    const imagePart: Part = { inlineData: { data: base64Image, mimeType } };
    const prompt = "Analyze this intraoral image for any suspicious lesions. Provide a risk level (Low, Medium, High), list your observations, and give a recommendation. This is an informational screening tool, not a diagnosis. Start with a very strong disclaimer about consulting a professional.";
    const schema = {
        type: Type.OBJECT,
        properties: {
            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            observations: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING },
            disclaimer: { type: Type.STRING },
        },
        required: ['riskLevel', 'observations', 'recommendation', 'disclaimer'],
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        return JSON.parse(cleanJsonString(response.text)) as OralLesionAnalysis;
    } catch (e) {
        return { error: 'Failed to analyze oral image.', riskLevel: 'Low', observations: [], recommendation: '', disclaimer: '' };
    }
};

export const compareOralImages = async (base64Image1: string, mimeType1: string, base64Image2: string, mimeType2: string): Promise<DentalComparisonAnalysis> => {
     if (!ai) throw createApiNotConfiguredError();
    const imagePart1: Part = { inlineData: { data: base64Image1, mimeType: mimeType1 } };
    const imagePart2: Part = { inlineData: { data: base64Image2, mimeType: mimeType2 } };
    const prompt = "Compare these two intraoral images of the same area taken at different times. Image 1 is older, Image 2 is newer. Identify any changes in size, color, or texture. Provide a recommendation. Start with a strong disclaimer.";
    const schema = {
        type: Type.OBJECT,
        properties: {
            disclaimer: { type: Type.STRING },
            changes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { area: { type: Type.STRING }, observation: { type: Type.STRING } } } },
            recommendation: { type: Type.STRING },
        },
        required: ['disclaimer', 'changes', 'recommendation'],
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: "Image 1:" }, imagePart1, { text: "Image 2:" }, imagePart2, { text: prompt }] },
            config: { responseMimeType: 'application/json', responseSchema: schema }
        });
        return JSON.parse(cleanJsonString(response.text)) as DentalComparisonAnalysis;
    } catch (e) {
        return { error: 'Failed to compare images.', disclaimer: '', changes: [], recommendation: '' };
    }
};

// DentaScribe
export const generateManuscriptSection = async (sectionTitle: string, topic: string, existingContent: string): Promise<string> => {
    if (!ai) throw createApiNotConfiguredError();
    const prompt = `Write the "${sectionTitle}" section for a dental scientific manuscript on the topic: "${topic}". If there is existing content, continue from it, otherwise start fresh.\n\nExisting content:\n${existingContent}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const paraphraseText = async (text: string): Promise<ParaphraseResult> => {
    const prompt = `Paraphrase the following text to improve clarity and avoid plagiarism, while maintaining the original meaning for a scientific audience:\n\n"${text}"`;
    const schema = { type: Type.OBJECT, properties: { paraphrasedText: { type: Type.STRING } }, required: ['paraphrasedText'] };
    return generateJsonResponse<ParaphraseResult>(prompt, schema);
};

export const suggestReferencesForManuscript = async (topic: string): Promise<{ summary: string; sources: GroundingChunk[] }> => {
    if (!ai) throw createApiNotConfiguredError();
    const prompt = `Find relevant scientific literature and provide key references for a manuscript on the topic: "${topic}". Provide a brief summary of the current literature.`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    return { summary: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const findJournalsForManuscript = async (abstract: string): Promise<JournalFinderResult> => {
    const prompt = `Based on the following abstract from a dental manuscript, suggest 5 suitable academic journals for submission. For each, provide the journal name, its scope, its relevance to the abstract, its impact factor (if known), and a URL to its homepage.\n\nAbstract:\n${abstract}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            suggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        journalName: { type: Type.STRING }, scope: { type: Type.STRING }, relevance: { type: Type.STRING }, impactFactor: { type: Type.STRING }, url: { type: Type.STRING },
                    },
                    required: ['journalName', 'scope', 'relevance', 'impactFactor', 'url']
                }
            }
        },
        required: ['suggestions']
    };
    return generateJsonResponse<JournalFinderResult>(prompt, schema);
};

export const checkPlagiarism = async (text: string): Promise<PlagiarismResult> => {
    if (!ai) throw createApiNotConfiguredError();

    const prompt = `Act as an advanced plagiarism checker for academic writing. Analyze the following text for potential plagiarism against online sources using your search capabilities.
    
    Your entire response MUST be a single JSON object with the following structure:
    {
      "plagiarismScore": number,
      "summary": "string",
      "plagiarizedPassages": [
        { "text": "string from the original input", "source": "string (URL)", "sourceTitle": "string" }
      ]
    }
    
    Follow these instructions carefully:
    1.  Provide an overall plagiarism percentage score (0-100), estimating the proportion of the text that is highly similar to existing sources.
    2.  Provide a brief, neutral summary of your findings.
    3.  Identify specific passages from the user's text that are highly similar or directly copied. For each passage:
        - The "text" field MUST be the exact text from the user's input.
        - The "source" field MUST be the most likely URL.
        - The "sourceTitle" field MUST be the title of the source page.
    4.  If no plagiarism is found, return a plagiarismScore of 0, a summary stating that no issues were found, and an empty plagiarizedPassages array.
    
    Text to analyze:
    "${text}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const cleanedJson = cleanJsonString(response.text);
        return JSON.parse(cleanedJson) as PlagiarismResult;
    } catch (e: any) {
        console.error("Error checking plagiarism:", e);
        return {
            error: "Failed to process the plagiarism check request. The AI response might be invalid.",
            plagiarismScore: 0,
            summary: "Error during analysis.",
            plagiarizedPassages: [],
        };
    }
};


// TraumaCareCompanion
export const getTraumaCareGuide = async (traumaType: string): Promise<TraumaCareGuide> => {
    const prompt = `Provide an emergency first-aid guide for the dental trauma: "${traumaType}". Specify the urgency level (Low, Moderate, High), list clear first-aid steps, list things to avoid, and state when to see a dentist.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            urgency: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'] },
            firstAidSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            whatToAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
            whenToSeeDentist: { type: Type.STRING },
        },
        required: ['urgency', 'firstAidSteps', 'whatToAvoid', 'whenToSeeDentist'],
    };
    return generateJsonResponse<TraumaCareGuide>(prompt, schema);
};

// DentaAI
export const processVoiceCommand = async (command: string, language: string, memory: object): Promise<DentaAiCommandResponse> => {
    const prompt = `You are DentaAI, a voice assistant for a dental super-app. The user is speaking ${language}. The command is: "${command}". Your current memory is: ${JSON.stringify(memory)}. Determine the user's intent. Respond with a 'responseText' for voice synthesis. If the intent is to navigate, set 'action' to 'navigate' and 'target' to the correct app path (e.g., /dentforge, /dentomedia). If you need to remember something, set 'action' to 'update_memory' and 'target' to a JSON string of the key-value pair to remember. Otherwise, set 'action' to 'inform'.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            responseText: { type: Type.STRING },
            action: { type: Type.STRING, enum: ['navigate', 'summarize', 'inform', 'update_memory'] },
            target: { type: Type.STRING },
        },
        required: ['responseText'],
    };
    return generateJsonResponse<DentaAiCommandResponse>(prompt, schema);
};

// DentaSim
export const simulatePatientCase = async (topic: string): Promise<CaseSimulation> => {
    const prompt = `Generate a realistic, detailed patient case simulation for a dental student based on the topic: "${topic}". Include patient history, reported symptoms, and radiographic findings.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            patientHistory: { type: Type.STRING },
            symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            radiographicFindings: { type: Type.STRING },
        },
        required: ['patientHistory', 'symptoms', 'radiographicFindings'],
    };
    return generateJsonResponse<CaseSimulation>(prompt, schema);
};

export const evaluateStudentPlan = async (caseInfo: string, studentPlan: string): Promise<CaseEvaluation> => {
    const prompt = `You are a dental school professor. Evaluate the student's diagnosis and treatment plan for the following case. Provide positive feedback, areas for improvement, your suggested plan, and a final assessment.\n\nCase: ${caseInfo}\n\nStudent's Plan: ${studentPlan}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            positiveFeedback: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedPlan: { type: Type.STRING },
            finalAssessment: { type: Type.STRING },
        },
        required: ['positiveFeedback', 'areasForImprovement', 'suggestedPlan', 'finalAssessment'],
    };
    return generateJsonResponse<CaseEvaluation>(prompt, schema);
};

// CDE-AI
export const findCdeCourses = async (interest: string): Promise<CDECourse[]> => {
    const prompt = `Generate a list of 3 realistic, mock Continuing Dental Education (CDE) courses related to "${interest}". For each, include a unique ID, title, provider, credit hours, a placeholder URL, and a date.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                provider: { type: Type.STRING },
                credits: { type: Type.NUMBER },
                url: { type: Type.STRING },
                date: { type: Type.STRING },
            },
            required: ['id', 'title', 'provider', 'credits', 'url', 'date'],
        }
    };
    return generateJsonResponse<CDECourse[]>(prompt, schema);
};

export const generateCdePresentation = async (topic: string): Promise<PresentationOutline> => {
    const prompt = `Create a presentation outline for a 1-hour CDE lecture on the topic: "${topic}". Provide a main title and a series of slides, each with a title and 3-5 bullet points.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            mainTitle: { type: Type.STRING },
            slides: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        points: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['title', 'points'],
                }
            }
        },
        required: ['mainTitle', 'slides'],
    };
    return generateJsonResponse<PresentationOutline>(prompt, schema);
};

// DentaJourney
export const generateWellnessJourney = async (goal: string): Promise<WellnessJourney> => {
    const prompt = `Generate a personalized dental wellness journey for a user with the goal: "${goal}". Create an introductory message, 3-4 distinct phases (each with a title, duration, focus, and 2-3 actionable tasks), and a final congratulatory message.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            goal: { type: Type.STRING },
            introductoryMessage: { type: Type.STRING },
            phases: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        focus: { type: Type.STRING },
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    isCompleted: { type: Type.BOOLEAN },
                                },
                                required: ['id', 'title', 'description', 'isCompleted']
                            }
                        }
                    },
                    required: ['title', 'duration', 'focus', 'tasks']
                }
            },
            finalMessage: { type: Type.STRING },
        },
        required: ['goal', 'introductoryMessage', 'phases', 'finalMessage'],
    };
    // The model will generate the data, but we need to ensure IDs are unique
    const result = await generateJsonResponse<Omit<WellnessJourney, 'id'>>(prompt, schema as any);

    if (result.error) return result as WellnessJourney;

    // Post-process to add unique IDs and default completed status
    const processedJourney: WellnessJourney = {
        ...result,
        id: Date.now().toString(), // Add top-level ID here
        phases: result.phases.map(phase => ({
            ...phase,
            tasks: phase.tasks.map(task => ({
                ...task,
                id: `${Date.now()}-${Math.random()}`,
                isCompleted: false,
            }))
        }))
    };
    return processedJourney;
};

// DentaVault
export const summarizeNote = async (noteContent: string): Promise<NoteSummary> => {
    const prompt = `You are an expert dental education assistant. Analyze the following study note and provide a concise summary, a list of key takeaways, and 3 multiple-choice quiz questions to test understanding.
    
    Note Content:
    "${noteContent}"`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: 'A brief summary of the note.' },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of 3-5 key takeaways from the note.' },
            quizQuestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'answer'],
                },
                description: 'A list of 3 multiple-choice questions based on the note.'
            },
        },
        required: ['summary', 'keyPoints', 'quizQuestions'],
    };

    return generateJsonResponse<NoteSummary>(prompt, schema);
};

export const generateFlashcardsFromNote = async (noteContent: string): Promise<FlashcardResult> => {
    const prompt = `You are a dental education assistant. Analyze the following study note and generate a set of 5-10 concise flashcards (question and answer pairs) that cover the key concepts.

    Note Content:
    "${noteContent}"`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            flashcards: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING, description: 'A clear, concise question.' },
                        answer: { type: Type.STRING, description: 'The corresponding answer.' },
                    },
                    required: ['question', 'answer'],
                },
                description: 'A list of flashcards based on the note.'
            },
        },
        required: ['flashcards'],
    };

    return generateJsonResponse<FlashcardResult>(prompt, schema);
};

export const createVaultChat = (documents: string): Chat => {
    if (!ai) throw createApiNotConfiguredError();
    const systemInstruction = `You are an AI study buddy specializing in dentistry. Your purpose is to answer questions based *only* on the content of the study materials provided. Be concise and helpful. If the answer cannot be found in the provided materials, clearly state that the information is not available in the documents. Do not use outside knowledge.

Provided Study Materials:
---
${documents}
---
`;
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction }
    });
};

// DentaSlides (Student Presentation Generator)
export const generateStudentPresentation = async (topic: string): Promise<PresentationOutline> => {
    const prompt = `Create a presentation outline for a dental student on the topic: "${topic}". The tone should be educational, clear, and structured for learning. Provide a main title and a series of slides, each with a title and 3-5 bullet points.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            mainTitle: { type: Type.STRING },
            slides: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        points: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['title', 'points'],
                }
            }
        },
        required: ['mainTitle', 'slides'],
    };
    return generateJsonResponse<PresentationOutline>(prompt, schema);
};

export const expandSlidePoint = async (point: string): Promise<string> => {
    if (!ai) throw createApiNotConfiguredError();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `For a dental presentation slide, expand this bullet point into a more detailed paragraph or a few sub-points: "${point}"`
    });
    return response.text;
};

export const suggestImageForSlide = async (slideContent: string): Promise<string> => {
    if (!ai) throw createApiNotConfiguredError();
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `A professional, aesthetically pleasing image for a dental presentation slide about: "${slideContent}". Clean, modern, educational style.`,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
    });
    return response.generatedImages[0].image.imageBytes;
};