
import React, { useState, useRef, useEffect, useMemo, useReducer } from 'react';
import { Post, Comment, ForumTopic, Conversation, ChatMessage, Project, UserProfile, ProjectTask, ProjectFile, ProjectDiscussionMessage, ProjectAssistance } from '../../types';
import { generateSocialPost, suggestCommentReplies, getProjectAssistance } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { Plus, MessageSquare, Briefcase, Users, Lock, Trash2, TrendingUp, Edit, Target, ClipboardList, FileText, CheckCircle, Send, Pin, Search, Tag, LogIn, LogOut, Rss, Wand2, Bot, Bookmark, Heart, Share2, Compass, MessageCircle, X } from 'lucide-react';

// ===================================
// MOCK DATA (Localized for India)
// ===================================

const currentUser: UserProfile = { id: 'user-0', name: 'Dr. Priya Sharma', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', email: 'priya.sharma@dentassist.com', role: 'Endodontist' };

const otherUsers: UserProfile[] = [
    { id: 'user-1', name: 'Dr. Vikram Singh', avatar: 'https://picsum.photos/id/1027/100/100', role: 'Prosthodontist' },
    { id: 'user-2', name: 'Dr. Arjun Mehta', avatar: 'https://picsum.photos/id/10/100/100', role: 'Oral Surgeon' },
    { id: 'user-3', name: 'Dr. Sneha Reddy', avatar: 'https://picsum.photos/id/1011/100/100', role: 'Pedodontist' },
    { id: 'user-4', name: 'Dr. Rohan Patel', avatar: 'https://picsum.photos/id/1005/100/100', role: 'Periodontist' },
];


const initialPostsData: Post[] = [
  { forumId: 'forum-1', id: 1, author: 'Dr. Vikram Singh', avatar: 'https://picsum.photos/id/1027/100/100', time: '2h ago', content: 'Just completed a fascinating case involving a full mouth reconstruction with zirconia crowns. The aesthetic results are incredible. Patient satisfaction is through the roof! #Prosthodontics', image: 'https://picsum.photos/seed/dental1/600/400', likes: 128, isLiked: false, isPinned: true, comments: [
      { id: 1, author: 'Dr. Arjun Mehta', avatar: 'https://picsum.photos/id/10/100/100', text: 'Amazing work, Vikram!' },
      { id: 2, author: 'Dr. Sneha Reddy', avatar: 'https://picsum.photos/id/1011/100/100', text: 'Truly inspiring!' },
  ]},
  { forumId: 'forum-2', id: 2, author: 'Dr. Rohan Patel', avatar: 'https://picsum.photos/id/1005/100/100', time: '5h ago', content: 'Discussion point: What are your preferred methods for soft tissue management around implants?', likes: 92, isLiked: true, comments: [] },
  { forumId: 'forum-1', id: 3, author: 'Dr. Arjun Mehta', avatar: 'https://picsum.photos/id/10/100/100', time: '1d ago', content: 'I have a case tomorrow with a lower right first molar that has severely curved roots shown on the radiograph. Any advice on sectioning techniques or specific instruments to avoid root fracture? Appreciate any insights.', likes: 45, comments: [{ id: 4, author: 'Dr. Vikram Singh', avatar: 'https://picsum.photos/id/1027/100/100', text: 'Consider using periotomes to loosen the PDL first. A surgical handpiece with a fine bur for sectioning is a must. Go slow!' }] },
];

const mockForumTopicsData: ForumTopic[] = [
    { id: 'forum-1', title: 'Clinical Case Discussions', description: 'Share and discuss interesting, challenging, or educational clinical cases.', icon: MessageSquare, privacy: 'public', members: [currentUser, ...otherUsers], memberCount: 5, postCount: 2, isUserCreated: false, tags: ['Prosthodontics', 'Restorative', 'Cases'] },
    { id: 'forum-2', title: 'Practice Management India', description: 'Topics on running a successful dental practice in India, from marketing to team building.', icon: Briefcase, privacy: 'public', members: [currentUser, ...otherUsers], memberCount: 5, postCount: 1, isUserCreated: false, tags: ['Business', 'Marketing'] },
    { id: 'forum-3', title: 'Implants & Surgery Study Club', description: 'A private group for surgeons to discuss advanced techniques and case planning.', icon: Users, privacy: 'private', members: [currentUser, otherUsers[0], otherUsers[3]], memberCount: 3, postCount: 0, isUserCreated: false, tags: ['Implants', 'Surgery', 'Advanced'] },
];

const mockConversationsData: Conversation[] = [
    {
        id: 1, participantName: 'Dr. Vikram Singh', participantAvatar: 'https://picsum.photos/id/1027/100/100', lastMessage: 'Thanks for the advice on the case! It went smoothly.', lastMessageTimestamp: '1h ago',
        messages: [
            { id: 1, sender: 'Dr. Vikram Singh', avatar: 'https://picsum.photos/id/1027/100/100', text: 'Hi there! Saw your post on the zirconia case. Amazing work.', timestamp: 'Yesterday' },
            { id: 2, sender: 'You', avatar: currentUser.avatar, text: 'Thank you! It was a challenging but rewarding case.', timestamp: 'Yesterday' },
            { id: 3, sender: 'Dr. Vikram Singh', avatar: 'https://picsum.photos/id/1027/100/100', text: 'Thanks for the advice on the case! It went smoothly.', timestamp: '1h ago' },
        ],
    },
    {
        id: 2, participantName: 'Dr. Rohan Patel', participantAvatar: 'https://picsum.photos/id/1005/100/100', lastMessage: 'Yes, let\'s discuss it further next week.', lastMessageTimestamp: '3d ago',
        messages: [
             { id: 1, sender: 'You', avatar: currentUser.avatar, text: 'Hey Rohan, wanted to pick your brain about the diode lasers you mentioned.', timestamp: '3d ago' },
             { id: 2, sender: 'Dr. Rohan Patel', avatar: 'https://picsum.photos/id/1005/100/100', text: 'Sure, happy to help. Yes, let\'s discuss it further next week.', timestamp: '3d ago' },
        ],
    },
];

const mockProjectsData: Project[] = [
    {
        id: 1,
        title: 'Research on Bio-Active Dental Materials',
        description: 'A collaborative study to evaluate the long-term clinical performance of new bio-active restorative materials in posterior teeth.',
        status: 'In Progress',
        privacy: 'private',
        lead: otherUsers[0], // Dr. Vikram Singh
        members: [currentUser, otherUsers[0], otherUsers[1]],
        goals: [
            'Finalize research protocol and gain IRB approval.',
            'Recruit 50 patients over the next 6 months.',
            'Publish findings in a peer-reviewed journal.',
        ],
        tasks: [
            { id: 1, text: 'Finalize research protocol', completed: true },
            { id: 2, text: 'Submit for IRB approval', completed: false },
            { id: 3, text: 'Recruit first batch of patients', completed: false },
        ],
        files: [
            { id: 1, name: 'Research_Protocol_v3.pdf', type: 'pdf', size: '1.2 MB', timestamp: '2 days ago', uploadedBy: otherUsers[0] },
            { id: 2, name: 'Patient_Consent_Form.docx', type: 'document', size: '88 KB', timestamp: '3 days ago', uploadedBy: otherUsers[0] },
        ],
        discussion: [
            { id: 1, user: otherUsers[0], message: 'The protocol for patient selection is finalized. Please review it in the shared documents.', timestamp: '2 days ago' },
            { id: 2, user: currentUser, message: 'Looks good, Vikram. I have a few potential candidates in mind for recruitment.', timestamp: '1 day ago' },
        ],
    },
    {
        id: 2,
        title: 'Community Outreach Program in Delhi Schools',
        description: 'Developing and implementing an educational program for schools in Delhi to improve oral hygiene awareness among children.',
        status: 'Planning',
        privacy: 'public',
        lead: currentUser,
        members: [currentUser, otherUsers[2]],
        goals: [
            'Develop engaging educational materials (pamphlets, presentations).',
            'Partner with at least 3 local elementary schools in Delhi.',
            'Conduct outreach events for over 200 children.',
        ],
        tasks: [
            { id: 4, text: 'Draft educational pamphlet', completed: true },
            { id: 5, text: 'Contact local school administrators', completed: false },
            { id: 6, text: 'Create presentation slides', completed: false },
        ],
        files: [],
        discussion: [],
    },
];


// ===================================
// STATE MANAGEMENT (useReducer)
// ===================================
type Tab = 'feed' | 'forums' | 'messaging' | 'projects';

interface DentomediaState {
  activeTab: Tab;
  posts: Post[];
  forumTopics: ForumTopic[];
  selectedForumId: string | null;
  conversations: Conversation[];
  activeConversationId: number | null;
  projects: Project[];
  selectedProject: Project | null;
  isProjectModalOpen: boolean;
  projectToEdit: Project | null;
}

type DentomediaAction =
  | { type: 'SET_ACTIVE_TAB'; payload: Tab }
  | { type: 'LIKE_POST'; payload: { postId: number } }
  | { type: 'SAVE_POST'; payload: { postId: number } }
  | { type: 'ADD_COMMENT'; payload: { postId: number; comment: Comment } }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'CREATE_FORUM'; payload: ForumTopic }
  | { type: 'DELETE_FORUM'; payload: { forumId: string } }
  | { type: 'JOIN_FORUM'; payload: { forumId: string; user: UserProfile } }
  | { type: 'LEAVE_FORUM'; payload: { forumId: string; userId: string | number } }
  | { type: 'TOGGLE_PIN'; payload: { postId: number } }
  | { type: 'SELECT_FORUM'; payload: { forumId: string | null } }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: { conversationId: number | null } }
  | { type: 'START_CONVERSATION'; payload: { participant: UserProfile } }
  | { type: 'SEND_MESSAGE'; payload: { conversationId: number; message: ChatMessage } }
  | { type: 'SELECT_PROJECT'; payload: { project: Project | null } }
  | { type: 'OPEN_PROJECT_MODAL'; payload: { projectToEdit: Project | null } }
  | { type: 'CLOSE_PROJECT_MODAL' }
  | { type: 'SAVE_PROJECT'; payload: { title: string, description: string, goals: string[], privacy: 'public' | 'private', id: number | null } }
  | { type: 'DELETE_PROJECT'; payload: { projectId: number } }
  | { type: 'TOGGLE_PROJECT_TASK'; payload: { projectId: number; taskId: number } }
  | { type: 'ADD_PROJECT_TASK'; payload: { projectId: number; task: ProjectTask } }
  | { type: 'ADD_PROJECT_FILE'; payload: { projectId: number; file: ProjectFile } }
  | { type: 'ADD_PROJECT_DISCUSSION'; payload: { projectId: number; message: ProjectDiscussionMessage } };


const initialState: DentomediaState = {
  activeTab: 'feed',
  posts: initialPostsData,
  forumTopics: mockForumTopicsData,
  selectedForumId: null,
  conversations: mockConversationsData,
  activeConversationId: mockConversationsData[0]?.id || null,
  projects: mockProjectsData,
  selectedProject: null,
  isProjectModalOpen: false,
  projectToEdit: null,
};

const dentomediaReducer = (state: DentomediaState, action: DentomediaAction): DentomediaState => {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'LIKE_POST':
      return { ...state, posts: state.posts.map(p => p.id === action.payload.postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p) };
    case 'SAVE_POST':
        return { ...state, posts: state.posts.map(p => p.id === action.payload.postId ? { ...p, isSaved: !p.isSaved } : p) };
    case 'ADD_COMMENT':
        return { ...state, posts: state.posts.map(p => p.id === action.payload.postId ? { ...p, comments: [...p.comments, action.payload.comment] } : p) };
    case 'ADD_POST':
        return { ...state, posts: [action.payload, ...state.posts] };
    case 'CREATE_FORUM':
        return { ...state, forumTopics: [action.payload, ...state.forumTopics] };
    case 'DELETE_FORUM':
        return { ...state, forumTopics: state.forumTopics.filter(f => f.id !== action.payload.forumId), selectedForumId: state.selectedForumId === action.payload.forumId ? null : state.selectedForumId };
    case 'JOIN_FORUM':
        return { ...state, forumTopics: state.forumTopics.map(t => t.id === action.payload.forumId ? { ...t, members: [...(t.members || []), action.payload.user], memberCount: (t.memberCount || 0) + 1 } : t) };
    case 'LEAVE_FORUM':
        return { ...state, forumTopics: state.forumTopics.map(t => t.id === action.payload.forumId ? { ...t, members: t.members?.filter(m => m.id !== action.payload.userId), memberCount: (t.memberCount || 1) - 1 } : t) };
    case 'TOGGLE_PIN':
        return { ...state, posts: state.posts.map(p => p.id === action.payload.postId ? { ...p, isPinned: !p.isPinned } : p) };
    case 'SELECT_FORUM':
        return { ...state, selectedForumId: action.payload.forumId };
     case 'SET_ACTIVE_CONVERSATION':
        return { ...state, activeConversationId: action.payload.conversationId };
    case 'START_CONVERSATION':
        const existingConvo = state.conversations.find(c => c.participantName === action.payload.participant.name);
        if (existingConvo) {
            return { ...state, activeConversationId: existingConvo.id };
        }
        const newConversation: Conversation = {
            id: Date.now(),
            participantName: action.payload.participant.name,
            participantAvatar: action.payload.participant.avatar,
            lastMessage: 'Started a new conversation.',
            lastMessageTimestamp: 'Just now',
            messages: [],
        };
        return { ...state, conversations: [newConversation, ...state.conversations], activeConversationId: newConversation.id };
    case 'SEND_MESSAGE':
      const updatedConversations = state.conversations.map(c => 
          c.id === action.payload.conversationId 
              ? { ...c, messages: [...c.messages, action.payload.message], lastMessage: action.payload.message.text, lastMessageTimestamp: 'Just now' } 
              : c
      );
      // Sort to bring the most recent conversation to the top
      updatedConversations.sort((a, b) => a.id === action.payload.conversationId ? -1 : b.id === action.payload.conversationId ? 1 : 0);
      return { ...state, conversations: updatedConversations };
    case 'SELECT_PROJECT':
        return { ...state, selectedProject: action.payload.project };
    case 'OPEN_PROJECT_MODAL':
        return { ...state, isProjectModalOpen: true, projectToEdit: action.payload.projectToEdit };
    case 'CLOSE_PROJECT_MODAL':
        return { ...state, isProjectModalOpen: false, projectToEdit: null };
    case 'SAVE_PROJECT':
        const { id, title, description, goals, privacy } = action.payload;
        if (id !== null) { // Editing
            const updatedProjects = state.projects.map(p => p.id === id ? { ...p, title, description, goals, privacy } : p);
            return { ...state, projects: updatedProjects, selectedProject: state.selectedProject?.id === id ? updatedProjects.find(p=>p.id===id) || null : state.selectedProject, isProjectModalOpen: false, projectToEdit: null };
        } else { // Creating
            const newProject: Project = { id: Date.now(), title, description, goals, privacy, status: 'Planning', lead: currentUser, members: [currentUser], tasks: [], files: [], discussion: [] };
            return { ...state, projects: [newProject, ...state.projects], isProjectModalOpen: false, projectToEdit: null };
        }
    case 'DELETE_PROJECT':
        return { ...state, projects: state.projects.filter(p => p.id !== action.payload.projectId), selectedProject: state.selectedProject?.id === action.payload.projectId ? null : state.selectedProject };
    case 'TOGGLE_PROJECT_TASK':
        const newProjects_TaskToggle = state.projects.map(p => p.id === action.payload.projectId ? { ...p, tasks: p.tasks.map(t => t.id === action.payload.taskId ? { ...t, completed: !t.completed } : t) } : p);
        return { ...state, projects: newProjects_TaskToggle, selectedProject: state.selectedProject ? newProjects_TaskToggle.find(p => p.id === state.selectedProject!.id) || null : null };
    case 'ADD_PROJECT_TASK':
        const newProjects_TaskAdd = state.projects.map(p => p.id === action.payload.projectId ? { ...p, tasks: [...p.tasks, action.payload.task] } : p);
        return { ...state, projects: newProjects_TaskAdd, selectedProject: state.selectedProject ? newProjects_TaskAdd.find(p => p.id === state.selectedProject!.id) || null : null };
    case 'ADD_PROJECT_FILE':
        const newProjects_FileAdd = state.projects.map(p => p.id === action.payload.projectId ? { ...p, files: [...p.files, action.payload.file] } : p);
        return { ...state, projects: newProjects_FileAdd, selectedProject: state.selectedProject ? newProjects_FileAdd.find(p => p.id === state.selectedProject!.id) || null : null };
    case 'ADD_PROJECT_DISCUSSION':
        const newProjects_DiscAdd = state.projects.map(p => p.id === action.payload.projectId ? { ...p, discussion: [...p.discussion, action.payload.message] } : p);
        return { ...state, projects: newProjects_DiscAdd, selectedProject: state.selectedProject ? newProjects_DiscAdd.find(p => p.id === state.selectedProject!.id) || null : null };
    default:
        throw new Error("Unhandled action in dentomediaReducer");
  }
};


// ===================================
// GENERIC & REUSABLE COMPONENTS
// ===================================

const CommentInput: React.FC<{ postContent: string; onComment: (text: string) => void }> = ({ postContent, onComment }) => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const handleComment = () => {
        if (!text.trim()) return;
        onComment(text);
        setText('');
        setSuggestions([]);
    };

    const handleAiSuggest = async () => {
        setIsLoading(true);
        setSuggestions([]);
        const replies = await suggestCommentReplies(postContent);
        setSuggestions(replies);
        setIsLoading(false);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setText(suggestion);
        setSuggestions([]);
    }

    return (
        <div className="flex items-center space-x-3 mt-4 relative">
            <img src={currentUser.avatar} alt="You" className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 relative">
                 <input
                    type="text"
                    placeholder="Write a comment..."
                    className="w-full bg-surface-dark border border-border-dark rounded-full py-2 px-4 pr-10 text-sm text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <button onClick={handleAiSuggest} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary-dark hover:text-brand-primary disabled:opacity-50">
                    {isLoading ? <Spinner /> : <Wand2 size={16}/>}
                </button>
                 {suggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-full bg-surface-dark border border-border-dark rounded-lg shadow-lg z-10 p-2 space-y-1">
                        {suggestions.map((s,i) => <button key={i} onClick={() => handleSuggestionClick(s)} className="w-full text-left text-sm p-2 rounded-md hover:bg-border-dark">{s}</button>)}
                    </div>
                )}
            </div>
            <button onClick={handleComment} className="text-brand-primary hover:text-teal-400 font-semibold text-sm">Send</button>
        </div>
    );
};

const CommentList: React.FC<{ comments: Comment[], postContent: string, onAddComment: (text: string) => void }> = ({ comments, postContent, onAddComment }) => (
    <div className="px-4 pt-4 mt-2 border-t border-border-dark bg-background-dark/50">
        {comments.map(comment => (
            <div key={comment.id} className="flex items-start space-x-3 mb-3">
                <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full" />
                <div className="flex-1 bg-surface-dark rounded-lg p-2 border border-border-dark">
                    <p className="font-semibold text-sm text-text-primary-dark">{comment.author}</p>
                    <p className="text-sm text-text-secondary-dark">{comment.text}</p>
                </div>
            </div>
        ))}
        <CommentInput postContent={postContent} onComment={onAddComment} />
    </div>
);


// ===================================
// FEED VIEW
// ===================================

const CreatePost: React.FC<{ onPost: (content: string, image: string | undefined, forumId: string) => void; joinedForums: ForumTopic[] }> = ({ onPost, joinedForums }) => {
    const [content, setContent] = useState('');
    const [image, setImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedForumId, setSelectedForumId] = useState(joinedForums[0]?.id || '');

    const handlePost = () => {
        if (!content.trim() || !selectedForumId) {
            alert("Please select a forum to post in.");
            return;
        };
        onPost(content, image || undefined, selectedForumId);
        setContent('');
        setImage('');
    };
    
    const handleAiPost = async () => {
        const topic = prompt("What should the post be about?");
        if (topic) {
            setIsLoading(true);
            try {
                const generatedContent = await generateSocialPost(topic);
                setContent(generatedContent);
            } catch (error) {
                console.error("Failed to generate post", error);
                alert("Sorry, could not generate the post.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="bg-surface-dark p-4 rounded-lg shadow-md border border-border-dark mb-6">
            <div className="flex items-start">
                <img src={currentUser.avatar} alt="You" className="w-11 h-11 rounded-full flex-shrink-0" />
                <textarea placeholder="Share a case, ask a question, or post an update..." className="flex-1 bg-background-dark border border-border-dark rounded-lg ml-4 p-3 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" rows={3} value={content} onChange={(e) => setContent(e.target.value)} disabled={isLoading}/>
            </div>
            <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
                <div className="flex items-center space-x-2 flex-1 ml-14">
                    <select value={selectedForumId} onChange={e => setSelectedForumId(e.target.value)} className="bg-background-dark border border-border-dark rounded-lg p-2 text-sm text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary">
                        <option value="" disabled>Select a forum...</option>
                        {joinedForums.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleAiPost} disabled={isLoading} className="bg-brand-secondary text-background-dark font-bold px-4 py-2 rounded-lg hover:brightness-110 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {isLoading ? <Spinner/> : <><Wand2 size={16}/> AI Post</>}
                    </button>
                    <button onClick={handlePost} disabled={!content.trim() || isLoading || !selectedForumId} className="bg-brand-primary px-6 py-2 rounded-lg text-white font-semibold hover:bg-teal-500 transition-colors disabled:bg-teal-800">Post</button>
                </div>
            </div>
        </div>
    );
};

const PostCard: React.FC<{ post: Post; onLike: (id: number) => void; onAddComment: (postId: number, text: string) => void; onSave: (id: number) => void; }> = ({ post, onLike, onAddComment, onSave }) => {
    const [showComments, setShowComments] = useState(false);
    return (
        <div className="bg-surface-dark rounded-lg shadow-md border border-border-dark overflow-hidden mb-6">
            <div className="p-4 flex items-center"><img src={post.avatar} alt={post.author} className="w-12 h-12 rounded-full" /><div className="ml-4"><p className="font-bold text-text-primary-dark">{post.author}</p><p className="text-xs text-text-secondary-dark">{post.time}</p></div></div>
            <div className="px-4 pb-4"><p className="text-text-secondary-dark whitespace-pre-wrap">{post.content}</p></div>
            {post.image && <img src={post.image} alt="Post content" className="w-full object-cover" />}
            <div className="px-4 py-3 flex justify-between items-center border-t border-border-dark">
                <div className="flex items-center gap-5 text-text-secondary-dark">
                    <button onClick={() => onLike(post.id)} className={`flex items-center gap-1.5 hover:text-red-500 ${post.isLiked ? 'text-red-500' : ''}`}>
                        <Heart size={20} className={post.isLiked ? 'fill-current' : ''} />
                        <span className="text-sm font-semibold">{post.likes}</span>
                    </button>
                    <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 hover:text-brand-primary">
                        <MessageCircle size={20} />
                        <span className="text-sm font-semibold">{post.comments.length}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-brand-primary">
                        <Share2 size={20} />
                    </button>
                </div>
                <button onClick={() => onSave(post.id)} className="text-text-secondary-dark hover:text-brand-primary" title={post.isSaved ? "Unsave Post" : "Save Post"}>
                    <Bookmark size={20} className={post.isSaved ? 'text-brand-primary fill-current' : ''} />
                </button>
            </div>
            {showComments && <CommentList comments={post.comments} postContent={post.content} onAddComment={(text) => onAddComment(post.id, text)} />}
        </div>
    );
};

const PinnedPostCard: React.FC<{
    post: Post;
    onLike: (id: number) => void;
    onAddComment: (postId: number, text: string) => void;
    onTogglePin: (postId: number) => void;
    onSave: (id: number) => void;
}> = ({ post, onLike, onAddComment, onTogglePin, onSave }) => (
    <div className="bg-brand-primary/10 border-l-4 border-brand-primary p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
                <Pin className="w-5 h-5 text-brand-primary"/>
                <span className="text-sm font-semibold text-brand-primary">Pinned Discussion</span>
            </div>
            <button onClick={() => onTogglePin(post.id)} className="text-xs text-text-secondary-dark hover:text-white font-semibold">Unpin</button>
        </div>
        <PostCard post={post} onLike={onLike} onAddComment={onAddComment} onSave={onSave} />
    </div>
);

// ===================================
// FORUMS VIEW
// ===================================
const ForumMembersSidebar: React.FC<{ members: UserProfile[] }> = ({ members }) => (
    <div className="bg-surface-dark p-4 rounded-lg shadow-sm border border-border-dark h-fit">
        <h4 className="text-md font-bold text-text-primary-dark mb-4">Members ({members.length})</h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
            {members.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                    <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover" />
                    <span className="text-sm font-medium text-text-secondary-dark">{member.name}</span>
                </div>
            ))}
        </div>
    </div>
);

const CreateForumModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string, privacy: 'public' | 'private', tags: string[]) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
    const [tags, setTags] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle(''); setDescription(''); setPrivacy('public'); setTags('');
            setTimeout(() => titleInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };

    const handleSubmit = () => {
        if (!title.trim() || !description.trim()) return;
        const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        onSubmit(title.trim(), description.trim(), privacy, tagArray);
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={handleBackdropClick}>
            <div ref={modalRef} className="bg-surface-dark rounded-lg shadow-xl p-6 w-full max-w-md border border-border-dark">
                <h2 className="text-2xl font-bold text-text-primary-dark mb-4">Create New Forum</h2>
                <div className="space-y-4">
                    <input ref={titleInputRef} type="text" placeholder="Title (e.g., Pediatric Dentistry)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description..." rows={3} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    <input type="text" placeholder="Tags (comma-separated, e.g., Implants, Endo)" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    <div className="flex rounded-md shadow-sm">
                        <button type="button" onClick={() => setPrivacy('public')} className={`flex-1 py-2 px-4 rounded-l-md border text-sm font-medium ${privacy === 'public' ? 'bg-brand-primary text-white border-brand-primary z-10' : 'bg-background-dark text-text-secondary-dark border-border-dark hover:bg-border-dark'}`}>Public</button>
                        <button type="button" onClick={() => setPrivacy('private')} className={`flex-1 py-2 px-4 rounded-r-md border-t border-b border-r text-sm font-medium -ml-px ${privacy === 'private' ? 'bg-brand-primary text-white border-brand-primary z-10' : 'bg-background-dark text-text-secondary-dark border-border-dark hover:bg-border-dark'}`}>Private</button>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-border-dark text-text-primary-dark font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
                    <button type="button" onClick={handleSubmit} disabled={!title.trim() || !description.trim()} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-500 disabled:bg-teal-800 transition-colors">Create Forum</button>
                </div>
            </div>
        </div>
    );
};

const ForumTopicCard: React.FC<{ topic: ForumTopic; isMember: boolean; onSelectForum: (id: string) => void; onRequestToJoin: (id: string) => void; onDeleteForum: (id: string) => void; onJoinForum: (id: string) => void; onLeaveForum: (id: string) => void; }> = ({ topic, isMember, onSelectForum, onRequestToJoin, onDeleteForum, onJoinForum, onLeaveForum }) => {
    const { icon: Icon, title, description, postCount, memberCount, isUserCreated, privacy, tags } = topic;
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) onDeleteForum(topic.id);
    }
    
    const renderActionButton = () => {
        if (privacy === 'private') {
            return isMember ? (
                <button onClick={() => onSelectForum(topic.id)} className="bg-background-dark text-brand-primary font-semibold py-2 px-4 rounded-lg border-2 border-brand-primary hover:bg-brand-primary/10 transition-colors">View Forum</button>
            ) : (
                <button onClick={() => onRequestToJoin(topic.id)} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-500 transition-colors">Request to Join</button>
            );
        }
        // Public forum logic
        return isMember ? (
            <button onClick={() => onSelectForum(topic.id)} className="bg-background-dark text-brand-primary font-semibold py-2 px-4 rounded-lg border-2 border-brand-primary hover:bg-brand-primary/10 transition-colors">View Forum</button>
        ) : (
            <button onClick={(e) => { e.stopPropagation(); onJoinForum(topic.id); }} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-500 transition-colors flex items-center gap-1.5"><LogIn size={16}/> Join</button>
        );
    };

    return (
        <div onClick={() => onSelectForum(topic.id)} className="bg-surface-dark rounded-lg shadow-sm border border-border-dark p-5 flex flex-col transition-transform hover:scale-[1.02] duration-200 cursor-pointer relative">
             {isUserCreated && <span className="absolute top-3 right-3 bg-yellow-400/20 text-yellow-300 text-xs font-semibold px-2 py-0.5 rounded-full z-10">Custom</span>}
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-background-dark flex items-center justify-center"><Icon className="w-7 h-7 text-brand-primary" /></div>
                <div className="flex-1"><div className="flex items-center">{privacy === 'private' && <Lock className="w-4 h-4 mr-2 text-text-secondary-dark flex-shrink-0" />}<h3 className="text-lg font-bold text-text-primary-dark pr-16">{title}</h3></div><p className="text-text-secondary-dark text-sm mt-1">{description}</p></div>
            </div>
             <div className="mt-4 flex flex-wrap gap-2">
                {tags?.map(tag => (
                    <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-brand-secondary/20 text-brand-secondary rounded-full">{tag}</span>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border-dark flex-grow flex items-end justify-between">
                <div className="flex space-x-4 text-sm text-text-secondary-dark"><div><strong className="text-text-primary-dark">{postCount?.toLocaleString() || 0}</strong> posts</div><div><strong className="text-text-primary-dark">{memberCount?.toLocaleString() || 0}</strong> members</div></div>
                <div className="flex items-center space-x-2">
                     {isUserCreated && <button onClick={handleDelete} title="Delete Forum" className="text-text-secondary-dark hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors"><Trash2 className="w-5 h-5"/></button>}
                     {isMember && privacy === 'public' && !isUserCreated && (
                        <button onClick={(e) => { e.stopPropagation(); onLeaveForum(topic.id); }} title="Leave Forum" className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-500/10 transition-colors flex items-center gap-1.5 text-sm font-semibold"><LogOut size={16}/> Leave</button>
                     )}
                    {renderActionButton()}
                </div>
            </div>
        </div>
    );
};

const ForumAccessDenied: React.FC<{ forum: ForumTopic, onBack: () => void }> = ({ forum, onBack }) => (
    <div>
         <button onClick={onBack} className="text-brand-primary hover:underline mb-4">&larr; Back to all forums</button>
        <div className="text-center bg-surface-dark rounded-lg p-12 border border-border-dark shadow-sm">
            <Lock className="w-16 h-16 mx-auto text-slate-700 mb-4" />
            <h2 className="text-2xl font-bold text-text-primary-dark">This Forum is Private</h2>
            <p className="text-text-secondary-dark mt-2 max-w-md mx-auto">"{forum.title}" is a private forum. You must be a member to view its content.</p>
        </div>
    </div>
);

const ForumDetailView: React.FC<{ forum: ForumTopic; posts: Post[]; onBack: () => void; onPostSubmit: (content: string, image: string | undefined, forumId: string) => void; onDeleteForum: (id: string) => void; onComment: (postId: number, commentText: string) => void; onLike: (postId: number) => void; currentUser: UserProfile; onTogglePin: (postId: number) => void; onSave: (postId: number) => void; }> = ({ forum, posts, onBack, onPostSubmit, onDeleteForum, onComment, onLike, currentUser, onTogglePin, onSave }) => {
    const forumPosts = posts.filter(p => p.forumId === forum.id);
    const pinnedPosts = forumPosts.filter(p => p.isPinned);
    const regularPosts = forumPosts.filter(p => !p.isPinned);

    return (
        <div>
            <button onClick={onBack} className="text-brand-primary hover:underline mb-4">&larr; Back to all forums</button>
             <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-grow lg:w-2/3">
                    <div className="bg-surface-dark rounded-lg shadow-sm border border-border-dark p-6 mb-6">
                        <div className="flex items-start md:items-center space-x-4">
                             <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-background-dark flex items-center justify-center">{forum.icon && <forum.icon className="w-9 h-9 text-brand-primary" />}</div>
                            <div className="flex-1"><div className="flex items-center">{forum.privacy === 'private' && <Lock className="w-5 h-5 mr-2 text-text-secondary-dark flex-shrink-0" />}<h2 className="text-3xl font-bold text-text-primary-dark">{forum.title}</h2></div><p className="text-text-secondary-dark mt-1">{forum.description}</p><div className="flex space-x-4 text-sm text-text-secondary-dark mt-2"><span><strong className="text-text-primary-dark">{forum.postCount?.toLocaleString() || 0}</strong> posts</span><span><strong className="text-text-primary-dark">{forum.memberCount?.toLocaleString() || 0}</strong> members</span></div></div>
                             {forum.isUserCreated && (<button onClick={() => onDeleteForum(forum.id)} className="ml-auto bg-red-500/10 text-red-400 font-bold py-2 px-4 rounded-lg hover:bg-red-500/20 transition duration-150 flex items-center space-x-2"><Trash2 className="w-5 h-5"/><span className="hidden sm:inline">Delete Forum</span></button>)}
                        </div>
                    </div>
                     {pinnedPosts.length > 0 && (
                        <div className="mb-8">
                            {pinnedPosts.map(post => <PinnedPostCard key={post.id} post={post} onTogglePin={onTogglePin} onLike={onLike} onAddComment={onComment} onSave={onSave}/>)}
                        </div>
                    )}
                    <div className="mb-6"><h3 className="text-xl font-bold text-text-primary-dark mb-4">Start a New Discussion</h3><CreatePost onPost={(content, image) => onPostSubmit(content, image, forum.id)} joinedForums={[forum]}/></div>
                    <h3 className="text-xl font-bold text-text-primary-dark mb-4 border-b border-border-dark pb-2">Discussions in {forum.title}</h3>
                    {regularPosts.length > 0 ? (
                        regularPosts.map(post => (
                            <div key={post.id} className="relative group">
                                <PostCard post={post} onLike={onLike} onAddComment={onComment} onSave={onSave} />
                                {forum.members && forum.members[0].id === currentUser.id && !post.isPinned && (
                                    <button onClick={() => onTogglePin(post.id)} className="absolute top-4 right-4 bg-surface-dark p-2 rounded-full text-text-secondary-dark opacity-0 group-hover:opacity-100 transition-opacity hover:bg-border-dark hover:text-brand-primary" title="Pin Post">
                                        <Pin size={18} />
                                    </button>
                                )}
                            </div>
                        ))
                    ) : pinnedPosts.length === 0 && <p className="text-text-secondary-dark mt-4">No discussions here yet. Be the first to start one!</p>}
                </div>
                <div className="lg:w-1/3">
                    {forum.members && <ForumMembersSidebar members={forum.members} />}
                </div>
            </div>
        </div>
    );
};

const ForumsView: React.FC<{
    state: DentomediaState;
    dispatch: React.Dispatch<DentomediaAction>;
}> = ({ state, dispatch }) => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [viewType, setViewType] = useState<'all' | 'my'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    
    const selectedForum = state.forumTopics.find(f => f.id === state.selectedForumId);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        state.forumTopics.forEach(topic => topic.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags).sort();
    }, [state.forumTopics]);

    const filteredTopics = useMemo(() => {
        return state.forumTopics
            .filter(topic => {
                if (viewType === 'my') {
                    return topic.members?.some(m => m.id === currentUser.id);
                }
                return true;
            })
            .filter(topic => {
                const query = searchQuery.toLowerCase();
                return topic.title.toLowerCase().includes(query) || topic.description.toLowerCase().includes(query);
            })
            .filter(topic => {
                if (selectedTag) {
                    return topic.tags?.includes(selectedTag);
                }
                return true;
            });
    }, [state.forumTopics, viewType, searchQuery, selectedTag, currentUser.id]);
    
    // Event Handlers that dispatch actions
    const onSelectForum = (id: string) => dispatch({ type: 'SELECT_FORUM', payload: { forumId: id } });
    const onBack = () => dispatch({ type: 'SELECT_FORUM', payload: { forumId: null } });
    const onPostSubmit = (content: string, image: string | undefined, forumId: string) => {
        const newPost: Post = { id: Date.now(), author: currentUser.name, avatar: currentUser.avatar, time: 'Just now', content, image, likes: 0, comments: [], forumId };
        dispatch({ type: 'ADD_POST', payload: newPost });
    };
    const onCreateForum = (title: string, description: string, privacy: 'public' | 'private', tags: string[]) => {
        const newForum: ForumTopic = { id: `forum-${Date.now()}`, title, description, privacy, icon: Users, members: [currentUser], isUserCreated: true, postCount: 0, memberCount: 1, tags };
        dispatch({ type: 'CREATE_FORUM', payload: newForum });
    };
    const onDeleteForum = (id: string) => dispatch({ type: 'DELETE_FORUM', payload: { forumId: id } });
    const onComment = (postId: number, commentText: string) => {
        const newComment: Comment = { id: Date.now(), author: currentUser.name, avatar: currentUser.avatar, text: commentText };
        dispatch({ type: 'ADD_COMMENT', payload: { postId, comment: newComment } });
    };
    const onLike = (postId: number) => dispatch({ type: 'LIKE_POST', payload: { postId } });
    const onSave = (postId: number) => dispatch({ type: 'SAVE_POST', payload: { postId } });
    const onTogglePin = (postId: number) => dispatch({ type: 'TOGGLE_PIN', payload: { postId } });
    const onJoinForum = (forumId: string) => dispatch({ type: 'JOIN_FORUM', payload: { forumId, user: currentUser } });
    const onLeaveForum = (forumId: string) => dispatch({ type: 'LEAVE_FORUM', payload: { forumId, userId: currentUser.id } });

    if(selectedForum) {
        const isMember = selectedForum.members?.some(m => m.id === currentUser.id) || false;
        if (selectedForum.privacy === 'private' && !isMember) {
            return <ForumAccessDenied forum={selectedForum} onBack={onBack} />;
        }
        return <ForumDetailView forum={selectedForum} posts={state.posts} onBack={onBack} onPostSubmit={onPostSubmit} onDeleteForum={onDeleteForum} onComment={onComment} onLike={onLike} currentUser={currentUser} onTogglePin={onTogglePin} onSave={onSave} />
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-text-primary-dark">Discussion Forums</h2><button onClick={() => setCreateModalOpen(true)} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-500 transition duration-150 flex items-center space-x-2"><Plus className="w-5 h-5"/><span>Create Forum</span></button></div>
            
            <div className="bg-surface-dark p-4 rounded-lg mb-6 border border-border-dark shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-dark" />
                        <input
                            type="text"
                            placeholder="Search forums..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-background-dark border border-border-dark rounded-lg p-2 pl-10 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                    </div>
                    <div className="flex-shrink-0 flex items-center bg-background-dark p-1 rounded-lg border border-border-dark">
                        <button onClick={() => setViewType('all')} className={`px-4 py-1 text-sm rounded-md transition-colors ${viewType === 'all' ? 'bg-border-dark text-text-primary-dark shadow' : 'text-text-secondary-dark'}`}>All Forums</button>
                        <button onClick={() => setViewType('my')} className={`px-4 py-1 text-sm rounded-md transition-colors ${viewType === 'my' ? 'bg-border-dark text-text-primary-dark shadow' : 'text-text-secondary-dark'}`}>My Forums</button>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border-dark flex flex-wrap gap-2 items-center">
                    <Tag className="w-5 h-5 text-text-secondary-dark mr-2"/>
                    <button onClick={() => setSelectedTag(null)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${!selectedTag ? 'bg-brand-primary text-white' : 'bg-background-dark text-text-secondary-dark hover:bg-border-dark'}`}>All Tags</button>
                    {allTags.map(tag => (
                        <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${selectedTag === tag ? 'bg-brand-primary text-white' : 'bg-background-dark text-text-secondary-dark hover:bg-border-dark'}`}>{tag}</button>
                    ))}
                </div>
            </div>

            <h3 className="text-xl font-bold text-text-primary-dark mb-4">
                {viewType === 'my' ? 'My Forums' : 'All Forums'} {selectedTag ? `- "${selectedTag}"` : ''}
            </h3>

            {filteredTopics.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredTopics.map(topic => {
                        const isMember = topic.members?.some(m => m.id === currentUser.id) || false;
                        return <ForumTopicCard key={topic.id} topic={topic} isMember={isMember} onSelectForum={onSelectForum} onRequestToJoin={() => alert(`Request to join "${topic.title}" sent!`)} onDeleteForum={onDeleteForum} onJoinForum={onJoinForum} onLeaveForum={onLeaveForum} />;
                    })}
                </div>
             ) : (
                <div className="text-center text-text-secondary-dark py-12 bg-surface-dark rounded-lg">
                    <p className="font-semibold">No forums found.</p>
                    <p className="text-sm">Try adjusting your search or filter settings.</p>
                </div>
            )}

            <CreateForumModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSubmit={onCreateForum}/>
        </div>
    );
};
// ===================================
// MESSAGING VIEW
// ===================================

const MessageInput: React.FC<{ onSend: (text: string) => void }> = ({ onSend }) => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text);
        setText('');
        setSuggestions([]);
    };

    const handleAiSuggest = async () => {
        setIsLoading(true);
        setSuggestions([]);
        const replies = await suggestCommentReplies("Suggest a professional and friendly reply to a colleague's message.");
        setSuggestions(replies.slice(0, 3));
        setIsLoading(false);
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        setText(suggestion);
        setSuggestions([]);
    }

    return (
        <div className="p-2 border-t border-border-dark relative">
            {suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full p-2 space-y-1">
                    {suggestions.map((s, i) => <button key={i} onClick={() => handleSuggestionClick(s)} className="w-full text-left text-sm p-2 rounded-md bg-surface-dark hover:bg-border-dark border border-border-dark">{s}</button>)}
                </div>
            )}
            <div className="flex items-center gap-2">
                <button onClick={handleAiSuggest} disabled={isLoading} className="p-2 text-text-secondary-dark hover:text-brand-primary disabled:opacity-50">
                    {isLoading ? <Spinner /> : <Wand2 size={20}/>}
                </button>
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-background-dark border border-border-dark rounded-full py-2 px-4 text-sm text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} disabled={!text.trim()} className="text-brand-primary hover:text-teal-400 font-semibold text-sm px-3 disabled:opacity-50">Send</button>
            </div>
        </div>
    );
};

const MessagingView: React.FC<{ state: DentomediaState, dispatch: React.Dispatch<DentomediaAction> }> = ({ state, dispatch }) => {
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const allUsers = useMemo(() => [currentUser, ...otherUsers], []);
    const existingConvoParticipantNames = useMemo(() => new Set(state.conversations.map(c => c.participantName)), [state.conversations]);
    
    const activeConversation = state.conversations.find(c => c.id === state.activeConversationId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation?.messages]);
    
    const filteredConversations = useMemo(() => {
        if (!messageSearchQuery) return state.conversations;
        const lowercasedQuery = messageSearchQuery.toLowerCase();
        return state.conversations.filter(c => c.participantName.toLowerCase().includes(lowercasedQuery));
    }, [state.conversations, messageSearchQuery]);

    const filteredNewUsers = useMemo(() => {
        if (!messageSearchQuery) return [];
        const lowercasedQuery = messageSearchQuery.toLowerCase();
        return allUsers.filter(user =>
            user.id !== currentUser.id &&
            !existingConvoParticipantNames.has(user.name) &&
            user.name.toLowerCase().includes(lowercasedQuery)
        );
    }, [allUsers, existingConvoParticipantNames, messageSearchQuery]);


    const handleSendMessage = (text: string) => {
        if (!state.activeConversationId) return;
        const newMessage: ChatMessage = {
            id: Date.now(),
            sender: 'You',
            avatar: currentUser.avatar,
            text,
            timestamp: 'Just now'
        };
        dispatch({ type: 'SEND_MESSAGE', payload: { conversationId: state.activeConversationId, message: newMessage }});
    };
    
    const handleStartConversation = (participant: UserProfile) => {
        dispatch({ type: 'START_CONVERSATION', payload: { participant } });
        setMessageSearchQuery('');
    };
    
    const handleSelectConversation = (id: number) => {
        dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: { conversationId: id } });
        setMessageSearchQuery('');
    };

    return (
        <div className="flex h-[calc(100vh-250px)] bg-surface-dark rounded-lg shadow-md border border-border-dark">
            <div className="w-full md:w-1/3 border-r border-border-dark flex flex-col">
                <div className="p-4 border-b border-border-dark">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-dark" />
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            value={messageSearchQuery}
                            onChange={e => setMessageSearchQuery(e.target.value)}
                            className="w-full bg-background-dark border border-border-dark rounded-lg p-2 pl-10 text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                    </div>
                </div>
                <div className="overflow-y-auto">
                    {(messageSearchQuery ? filteredConversations : state.conversations).map(convo => (
                        <div key={convo.id} onClick={() => handleSelectConversation(convo.id)} className={`p-4 flex items-center gap-3 cursor-pointer border-l-4 ${state.activeConversationId === convo.id ? 'bg-background-dark border-brand-primary' : 'border-transparent hover:bg-border-dark'}`}>
                            <img src={convo.participantAvatar} alt={convo.participantName} className="w-12 h-12 rounded-full" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-text-primary-dark truncate">{convo.participantName}</p>
                                <p className="text-sm text-text-secondary-dark truncate">{convo.lastMessage}</p>
                            </div>
                        </div>
                    ))}
                    {messageSearchQuery && filteredNewUsers.map(user => (
                        <div key={user.id} onClick={() => handleStartConversation(user)} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-border-dark">
                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-text-primary-dark truncate">{user.name}</p>
                                <p className="text-sm text-text-secondary-dark truncate">Start a new conversation</p>
                            </div>
                        </div>
                    ))}
                     {messageSearchQuery && filteredConversations.length === 0 && filteredNewUsers.length === 0 && (
                        <p className="p-4 text-center text-text-secondary-dark text-sm">No results found.</p>
                    )}
                </div>
            </div>
            <div className="hidden md:flex w-2/3 flex-col">
                {activeConversation ? (
                    <>
                        <div className="p-4 border-b border-border-dark flex items-center gap-3"><img src={activeConversation.participantAvatar} alt="" className="w-10 h-10 rounded-full" /><p className="font-bold text-text-primary-dark">{activeConversation.participantName}</p></div>
                        <div className="flex-1 p-4 overflow-y-auto bg-background-dark/30">
                            {activeConversation.messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-2 my-2 ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.sender !== 'You' && <img src={msg.avatar} alt={msg.sender} className="w-8 h-8 rounded-full" />}
                                    <div className={`px-3 py-2 rounded-lg max-w-sm ${msg.sender === 'You' ? 'bg-brand-primary text-white' : 'bg-surface-dark border border-border-dark text-text-primary-dark'}`}>{msg.text}</div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <MessageInput onSend={handleSendMessage} />
                    </>
                ) : <div className="flex-1 flex items-center justify-center text-text-secondary-dark">Select a conversation to start chatting.</div>}
            </div>
        </div>
    );
};


// ===================================
// PROJECTS VIEW (NEW IMPLEMENTATION)
// ===================================

const statusColors: { [key in Project['status']]: string } = {
    'In Progress': 'bg-blue-900/50 text-blue-300',
    'Completed': 'bg-green-900/50 text-green-300',
    'Planning': 'bg-yellow-900/50 text-yellow-300',
    'On Hold': 'bg-red-900/50 text-red-300',
};

const AdvancedProjectCard: React.FC<{ 
    project: Project; 
    onSelectProject: (project: Project) => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (projectId: number) => void;
    onViewProfile: (profile: UserProfile) => void;
}> = ({ project, onSelectProject, onEditProject, onDeleteProject, onViewProfile }) => {
    const completedTasks = project.tasks.filter(t => t.completed).length;
    const totalTasks = project.tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return (
        <div onClick={() => onSelectProject(project)} className="bg-surface-dark rounded-lg shadow-sm border border-border-dark p-5 cursor-pointer transition-all hover:shadow-lg hover:border-brand-primary flex flex-col relative">
            <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center flex-1 pr-4">
                    {project.privacy === 'private' && <span className="flex-shrink-0" title="Private Project"><Lock className="w-4 h-4 mr-2 text-text-secondary-dark"/></span>}
                    <h3 className="text-lg font-bold text-text-primary-dark truncate">{project.title}</h3>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColors[project.status]}`}>{project.status}</span>
            </div>
            <p className="text-text-secondary-dark text-sm mt-1 mb-4 h-10 overflow-hidden flex-grow">{project.description}</p>
            
            <div className="mb-2">
                <div className="flex justify-between items-center text-xs text-text-secondary-dark mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-background-dark rounded-full h-2">
                    <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-dark">
                <div className="flex -space-x-2">
                    {project.members.slice(0, 4).map(member => (
                        <button key={member.id} onClick={(e) => { e.stopPropagation(); onViewProfile(member); }} className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                            <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border-2 border-surface-dark object-cover" title={member.name} />
                        </button>
                    ))}
                    {project.members.length > 4 && 
                        <div className="w-8 h-8 rounded-full border-2 border-surface-dark bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">+{project.members.length - 4}</div>
                    }
                </div>
                <div className="text-sm text-text-secondary-dark flex items-center space-x-2">
                     <span>{completedTasks} / {totalTasks} tasks</span>
                     <button onClick={(e) => { e.stopPropagation(); onEditProject(project); }} title="Edit Project" className="p-2 rounded-full text-text-secondary-dark hover:bg-border-dark hover:text-text-primary-dark transition-colors">
                        <Edit className="w-5 h-5"/>
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} title="Delete Project" className="p-2 rounded-full text-text-secondary-dark hover:bg-red-500/20 hover:text-red-400 transition-colors">
                        <Trash2 className="w-5 h-5"/>
                     </button>
                </div>
            </div>
        </div>
    );
};

const ProjectOverviewTab: React.FC<{ project: Project; onViewProfile: (profile: UserProfile) => void }> = ({ project, onViewProfile }) => {
    const completedTasks = project.tasks.filter(t => t.completed).length;
    const totalTasks = project.tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <div>
                    <h4 className="flex items-center text-lg font-semibold text-text-primary-dark mb-3"><Target className="w-5 h-5 mr-2 text-brand-primary" />Project Goals</h4>
                    <ul className="list-disc list-inside space-y-2 text-text-secondary-dark">
                        {project.goals.map((goal, index) => <li key={index}>{goal}</li>)}
                    </ul>
                </div>
                 <div>
                    <h4 className="flex items-center text-lg font-semibold text-text-primary-dark mb-3"><ClipboardList className="w-5 h-5 mr-2 text-brand-primary" />Task Progress</h4>
                     <div className="w-full bg-background-dark rounded-full h-4">
                        <div className="bg-brand-primary h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ width: `${progress}%` }}>
                            {Math.round(progress)}%
                        </div>
                    </div>
                     <p className="text-sm text-text-secondary-dark text-center mt-2">{completedTasks} of {totalTasks} tasks completed</p>
                </div>
            </div>
            <div className="md:col-span-1 space-y-4">
                <div>
                    <h4 className="font-semibold text-text-primary-dark mb-2">Status</h4>
                     <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusColors[project.status]}`}>{project.status}</span>
                </div>
                <div>
                    <h4 className="flex items-center font-semibold text-text-primary-dark mb-2"><Users className="w-5 h-5 mr-2" />Members</h4>
                    <div className="space-y-3">
                         <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onViewProfile(project.lead)}>
                            <img src={project.lead.avatar} className="w-10 h-10 rounded-full object-cover"/>
                            <div>
                                <p className="font-bold text-text-primary-dark">{project.lead.name}</p>
                                <p className="text-xs text-brand-primary font-semibold">Project Lead</p>
                            </div>
                        </div>
                        {project.members.filter(m => m.id !== project.lead.id).map(member => (
                             <div key={member.id} className="flex items-center space-x-3 cursor-pointer" onClick={() => onViewProfile(member)}>
                                <img src={member.avatar} className="w-10 h-10 rounded-full object-cover"/>
                                <div>
                                    <p className="font-medium text-text-secondary-dark">{member.name}</p>
                                    <p className="text-xs text-slate-500">Member</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectTasksTab: React.FC<{
    tasks: ProjectTask[];
    onToggleTask: (taskId: number) => void;
    onAddTask: (taskText: string) => void;
}> = ({ tasks, onToggleTask, onAddTask }) => {
     const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = () => {
        if (newTaskText.trim()) {
            onAddTask(newTaskText);
            setNewTaskText('');
        }
    };
    return (
        <div>
             <div className="space-y-3">
                {tasks.map(task => (
                    <div key={task.id} onClick={() => onToggleTask(task.id)} className="flex items-center p-3 rounded-lg hover:bg-background-dark cursor-pointer border border-border-dark">
                        <button className="mr-4">
                            {task.completed ? <CheckCircle className="w-7 h-7 text-green-500" /> : <div className="w-7 h-7 border-2 border-slate-600 rounded-full"></div>}
                        </button>
                        <span className={`flex-1 text-base ${task.completed ? 'line-through text-text-secondary-dark' : 'text-text-primary-dark'}`}>{task.text}</span>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex space-x-2 border-t border-border-dark pt-4">
                <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                    placeholder="Add a new task..."
                    className="flex-1 p-3 bg-background-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-brand-primary text-text-primary-dark"
                />
                <button onClick={handleAddTask} className="p-3 bg-brand-primary text-white rounded-lg hover:bg-teal-500 disabled:bg-teal-800 flex items-center justify-center" disabled={!newTaskText.trim()}>
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const ProjectFilesTab: React.FC<{
    files: ProjectFile[];
    onAddFile: (file: { name: string, type: 'document' | 'pdf' | 'image', size: string }) => void;
}> = ({ files, onAddFile }) => {
    // Mock file upload
    const handleAddFile = () => {
        onAddFile({name: 'New_Document.pdf', type: 'pdf', size: '3.1 MB'});
    }

    return (
        <div>
             <div className="flex justify-end mb-4">
                <button onClick={handleAddFile} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-500 flex items-center space-x-2">
                    <Plus className="w-5 h-5"/>
                    <span>Upload File</span>
                </button>
            </div>
            <ul className="bg-surface-dark rounded-lg border border-border-dark divide-y divide-border-dark">
                {files.map(file => (
                     <li key={file.id} className="p-4 flex items-center justify-between hover:bg-background-dark">
                        <div className="flex items-center space-x-4">
                            <FileText className="w-8 h-8 text-text-secondary-dark"/>
                            <div>
                                <p className="font-semibold text-text-primary-dark">{file.name}</p>
                                <p className="text-sm text-text-secondary-dark">
                                    Uploaded by {file.uploadedBy.name} &middot; {file.timestamp} &middot; {file.size}
                                </p>
                            </div>
                        </div>
                        <button className="text-brand-primary font-medium text-sm">Download</button>
                    </li>
                ))}
            </ul>
            {files.length === 0 && <p className="text-center text-text-secondary-dark py-8">No files have been uploaded yet.</p>}
        </div>
    )
};

const ProjectDiscussionTab: React.FC<{
    discussion: ProjectDiscussionMessage[];
    onAddMessage: (message: string) => void;
    currentUser: UserProfile;
}> = ({ discussion, onAddMessage, currentUser }) => {
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            onAddMessage(newMessage);
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-dark rounded-t-lg">
                {discussion.map(msg => (
                     <div key={msg.id} className="flex items-start gap-3">
                        <img src={msg.user.avatar} alt={msg.user.name} className="w-10 h-10 rounded-full object-cover"/>
                        <div>
                            <p className="font-bold text-text-primary-dark">{msg.user.name} <span className="text-xs text-text-secondary-dark font-normal ml-2">{msg.timestamp}</span></p>
                            <div className="mt-1 p-3 rounded-lg bg-surface-dark border border-border-dark text-text-secondary-dark">
                                {msg.message}
                            </div>
                        </div>
                    </div>
                ))}
                 {discussion.length === 0 && <p className="text-center text-text-secondary-dark py-8">No messages yet. Start the conversation!</p>}
            </div>
             <div className="p-4 border-t border-border-dark bg-surface-dark rounded-b-lg">
                <div className="flex items-center space-x-3">
                    <img src={currentUser.avatar} alt="Your avatar" className="w-10 h-10 rounded-full" />
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 p-3 bg-background-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-brand-primary text-text-primary-dark"
                    />
                    <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="bg-brand-primary text-white font-bold p-3 rounded-lg hover:bg-teal-500 disabled:bg-teal-800">
                        <Send className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProjectFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { id: number | null, title: string, description: string, goals: string, privacy: 'public' | 'private' }) => void;
    projectToEdit: Project | null;
}> = ({ isOpen, onClose, onSubmit, projectToEdit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [goals, setGoals] = useState('');
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public');

    useEffect(() => {
        if (projectToEdit && isOpen) {
            setTitle(projectToEdit.title);
            setDescription(projectToEdit.description);
            setGoals(projectToEdit.goals.join('\n'));
            setPrivacy(projectToEdit.privacy);
        } else {
            setTitle('');
            setDescription('');
            setGoals('');
            setPrivacy('public');
        }
    }, [projectToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (title.trim() && description.trim()) {
            onSubmit({ 
                id: projectToEdit?.id ?? null,
                title, 
                description, 
                goals,
                privacy
            });
        }
    };

    const isEditing = !!projectToEdit;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-surface-dark rounded-lg shadow-xl p-6 w-full max-w-lg border border-border-dark">
                <h2 className="text-2xl font-bold text-text-primary-dark mb-4">{isEditing ? 'Edit Project' : 'Create New Project'}</h2>
                <div className="space-y-4">
                     <input
                        type="text" id="project-title" value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="Project Title"
                    />
                    <textarea
                        id="project-description" value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="Project Description"
                    ></textarea>
                    <textarea
                        id="project-goals" value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        rows={3}
                        className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="Primary Goals (one per line)"
                    ></textarea>
                     <div className="flex rounded-md shadow-sm">
                        <button type="button" onClick={() => setPrivacy('public')} className={`flex-1 py-2 px-4 rounded-l-md border text-sm font-medium ${privacy === 'public' ? 'bg-brand-primary text-white border-brand-primary z-10' : 'bg-background-dark text-text-secondary-dark border-border-dark hover:bg-border-dark'}`}>Public</button>
                        <button type="button" onClick={() => setPrivacy('private')} className={`flex-1 py-2 px-4 rounded-r-md border-t border-b border-r text-sm font-medium -ml-px ${privacy === 'private' ? 'bg-brand-primary text-white border-brand-primary z-10' : 'bg-background-dark text-text-secondary-dark border-border-dark hover:bg-border-dark'}`}>Private</button>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="bg-border-dark text-text-primary-dark font-bold py-2 px-4 rounded-lg hover:bg-slate-600">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim() || !description.trim()}
                        className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-500 disabled:bg-teal-800"
                    >
                        {isEditing ? 'Save Changes' : 'Create Project'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProjectAssistantModal: React.FC<{ isOpen: boolean, onClose: () => void, project: Project | null }> = ({ isOpen, onClose, project }) => {
    const [assistance, setAssistance] = useState<ProjectAssistance | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && project) {
            const fetchAssistance = async () => {
                setIsLoading(true);
                setAssistance(null);
                const result = await getProjectAssistance(project);
                setAssistance(result);
                setIsLoading(false);
            };
            fetchAssistance();
        }
    }, [isOpen, project]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-dark rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-border-dark" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-text-primary-dark flex items-center gap-3"><Bot className="text-brand-primary"/> AI Project Assistant</h2>
                    <button onClick={onClose} className="text-text-secondary-dark hover:text-white">
                        <X size={24}/>
                    </button>
                </div>
                {isLoading && <div className="text-center p-12"><Spinner /></div>}
                {assistance?.error && <p className="text-red-400">{assistance.error}</p>}
                {assistance && !assistance.error && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div><h3 className="font-bold text-lg text-brand-primary mb-2">Summary</h3><p className="text-text-secondary-dark text-sm">{assistance.summary}</p></div>
                        <div><h3 className="font-bold text-lg text-brand-primary mb-2">Suggested Next Steps</h3><ul className="list-disc list-inside text-text-secondary-dark text-sm space-y-1">{assistance.suggestedNextSteps.map((step, i) => <li key={i}>{step}</li>)}</ul></div>
                        <div><h3 className="font-bold text-lg text-brand-primary mb-2">Potential Risks</h3><ul className="list-disc list-inside text-text-secondary-dark text-sm space-y-1">{assistance.potentialRisks.map((risk, i) => <li key={i}>{risk}</li>)}</ul></div>
                    </div>
                )}
            </div>
        </div>
    );
};


const ProjectDetailView: React.FC<{
    project: Project;
    onBack: () => void;
    onViewProfile: (profile: UserProfile) => void;
    onToggleTask: (taskId: number) => void;
    onAddTask: (taskText: string) => void;
    onAddFile: (file: { name: string; type: 'document' | 'pdf' | 'image'; size: string; }) => void;
    onAddDiscussionMessage: (message: string) => void;
    onEditProject: () => void;
    onDeleteProject: () => void;
    currentUser: UserProfile;
}> = ({ project, onBack, onViewProfile, onToggleTask, onAddTask, onAddFile, onAddDiscussionMessage, onEditProject, onDeleteProject, currentUser }) => {
    type TabType = 'Overview' | 'Tasks' | 'Files' | 'Discussion';
    const [activeTab, setActiveTab] = useState<TabType>('Overview');
    const [isAssistantOpen, setAssistantOpen] = useState(false);
    
    const tabs = [
        { name: 'Overview' as const, icon: Target },
        { name: 'Tasks' as const, icon: ClipboardList },
        { name: 'Files' as const, icon: FileText },
        { name: 'Discussion' as const, icon: MessageSquare },
    ];

    return (
        <div>
            <button onClick={onBack} className="text-brand-primary hover:underline mb-4">&larr; Back to all projects</button>
            <div className="bg-surface-dark rounded-lg shadow-sm border border-border-dark p-6 mb-6">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center">
                            {project.privacy === 'private' && <Lock className="w-5 h-5 mr-2 text-text-secondary-dark flex-shrink-0" />}
                            <h2 className="text-3xl font-bold text-text-primary-dark">{project.title}</h2>
                        </div>
                        <p className="text-text-secondary-dark mt-2">{project.description}</p>
                    </div>
                     <div className="flex-shrink-0 flex items-center space-x-2">
                        <button onClick={() => setAssistantOpen(true)} className="bg-brand-secondary/20 text-brand-secondary font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary/30 transition duration-150 flex items-center space-x-2">
                            <Bot className="w-5 h-5"/>
                            <span className="hidden sm:inline">AI Assistant</span>
                        </button>
                        <button onClick={onEditProject} className="bg-border-dark text-text-primary-dark font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition duration-150 flex items-center space-x-2">
                            <Edit className="w-5 h-5"/>
                            <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button onClick={onDeleteProject} className="bg-red-500/10 text-red-400 font-bold py-2 px-4 rounded-lg hover:bg-red-500/20 transition duration-150 flex items-center space-x-2">
                            <Trash2 className="w-5 h-5"/>
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    </div>
                </div>
            </div>

             <div className="bg-surface-dark rounded-lg shadow-sm border border-border-dark">
                <div className="border-b border-border-dark">
                    <nav className="-mb-px flex space-x-4 sm:space-x-8 px-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                                    ${activeTab === tab.name
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-text-secondary-dark hover:text-text-primary-dark hover:border-slate-600'
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 mr-2 ${activeTab === tab.name ? 'text-brand-primary' : 'text-text-secondary-dark'}`} />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-6">
                    {activeTab === 'Overview' && <ProjectOverviewTab project={project} onViewProfile={onViewProfile} />}
                    {activeTab === 'Tasks' && <ProjectTasksTab tasks={project.tasks} onToggleTask={onToggleTask} onAddTask={onAddTask} />}
                    {activeTab === 'Files' && <ProjectFilesTab files={project.files} onAddFile={onAddFile} />}
                    {activeTab === 'Discussion' && <ProjectDiscussionTab discussion={project.discussion} onAddMessage={onAddDiscussionMessage} currentUser={currentUser} />}
                </div>
            </div>
             <ProjectAssistantModal isOpen={isAssistantOpen} onClose={() => setAssistantOpen(false)} project={project}/>
        </div>
    );
};

const AdvancedProjectsView: React.FC<{
    state: DentomediaState;
    dispatch: React.Dispatch<DentomediaAction>;
}> = ({ state, dispatch }) => {
    
    // Event Handlers that dispatch actions
    const onSelectProject = (project: Project | null) => dispatch({ type: 'SELECT_PROJECT', payload: { project } });
    const onViewProfile = (profile: UserProfile) => alert(`Viewing profile of ${profile.name}`);
    const onToggleTask = (projectId: number, taskId: number) => dispatch({ type: 'TOGGLE_PROJECT_TASK', payload: { projectId, taskId } });
    const onAddTask = (projectId: number, taskText: string) => {
        const newTask: ProjectTask = { id: Date.now(), text: taskText, completed: false };
        dispatch({ type: 'ADD_PROJECT_TASK', payload: { projectId, task: newTask } });
    };
    const onCreateProjectClick = () => dispatch({ type: 'OPEN_PROJECT_MODAL', payload: { projectToEdit: null } });
    const onAddFile = (projectId: number, file: { name: string; type: 'document' | 'pdf' | 'image'; size: string; }) => {
        const newFile: ProjectFile = { ...file, id: Date.now(), timestamp: 'Just now', uploadedBy: currentUser };
        dispatch({ type: 'ADD_PROJECT_FILE', payload: { projectId, file: newFile } });
    };
    const onAddDiscussionMessage = (projectId: number, message: string) => {
        const newMsg: ProjectDiscussionMessage = { id: Date.now(), message, user: currentUser, timestamp: 'Just now' };
        dispatch({ type: 'ADD_PROJECT_DISCUSSION', payload: { projectId, message: newMsg } });
    };
    const onEditProject = (project: Project) => dispatch({ type: 'OPEN_PROJECT_MODAL', payload: { projectToEdit: project } });
    const onDeleteProject = (projectId: number) => {
        if(window.confirm('Are you sure you want to delete this project?')) {
            dispatch({ type: 'DELETE_PROJECT', payload: { projectId } });
        }
    };

    if (state.selectedProject) {
        return <ProjectDetailView 
            project={state.selectedProject} 
            onBack={() => onSelectProject(null)}
            onViewProfile={onViewProfile}
            onToggleTask={(taskId) => onToggleTask(state.selectedProject!.id, taskId)}
            onAddTask={(taskText) => onAddTask(state.selectedProject!.id, taskText)}
            onAddFile={(file) => onAddFile(state.selectedProject!.id, file)}
            onAddDiscussionMessage={(message) => onAddDiscussionMessage(state.selectedProject!.id, message)}
            onEditProject={() => onEditProject(state.selectedProject!)}
            onDeleteProject={() => onDeleteProject(state.selectedProject!.id)}
            currentUser={currentUser}
        />
    }
    
    const visibleProjects = state.projects.filter(p => p.privacy === 'public' || p.members.some(m => m.id === currentUser.id));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary-dark">Collaborative Projects</h2>
                    <p className="text-text-secondary-dark mt-1">Join or create projects to collaborate with peers.</p>
                </div>
                 <button onClick={onCreateProjectClick} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-500 transition duration-150 flex items-center space-x-2">
                    <Plus className="w-5 h-5"/>
                    <span>Create Project</span>
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {visibleProjects.map(project => (
                    <AdvancedProjectCard 
                        key={project.id} 
                        project={project} 
                        onSelectProject={onSelectProject}
                        onEditProject={onEditProject}
                        onDeleteProject={onDeleteProject}
                        onViewProfile={onViewProfile}
                    />
                ))}
            </div>
        </div>
    );
};

// ===================================
// MAIN COMPONENT
// ===================================
const TabButton: React.FC<{
  name: Tab;
  label: string;
  icon: React.ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}> = ({ name, label, icon, activeTab, setActiveTab }) => (
    <button onClick={() => setActiveTab(name)} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === name ? 'bg-surface-dark text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary-dark hover:bg-border-dark'}`}>
        {icon} {label}
    </button>
);

export const Dentomedia: React.FC = () => {
    const [state, dispatch] = useReducer(dentomediaReducer, initialState);
    const [searchQuery, setSearchQuery] = useState('');
    const [feedFilter, setFeedFilter] = useState<'following' | 'explore' | 'saved'>('following');
    const [searchTab, setSearchTab] = useState<'posts' | 'people'>('posts');

    const allUsers = useMemo(() => [currentUser, ...otherUsers], []);

    const publicForumIds = useMemo(() => new Set(state.forumTopics.filter(f => f.privacy === 'public').map(f => f.id)), [state.forumTopics]);
    const myJoinedForums = useMemo(() => state.forumTopics.filter(f => f.members?.some(m => m.id === currentUser.id)), [state.forumTopics]);
    const myJoinedForumIds = useMemo(() => new Set(myJoinedForums.map(f => f.id)), [myJoinedForums]);

    const filteredFeedPosts = useMemo(() => {
        if (feedFilter === 'following') {
            return state.posts.filter(p => p.forumId && myJoinedForumIds.has(p.forumId));
        }
        if (feedFilter === 'explore') {
            return state.posts.filter(p => p.forumId && publicForumIds.has(p.forumId));
        }
        return state.posts.filter(p => p.isSaved);
    }, [state.posts, feedFilter, myJoinedForumIds, publicForumIds]);

    const searchedPosts = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const lowercasedQuery = searchQuery.toLowerCase();
        return state.posts.filter(p => 
            p.content.toLowerCase().includes(lowercasedQuery) ||
            p.author.toLowerCase().includes(lowercasedQuery)
        );
    }, [state.posts, searchQuery]);

    const searchedPeople = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const lowercasedQuery = searchQuery.toLowerCase();
        return allUsers.filter(u =>
            u.name.toLowerCase().includes(lowercasedQuery) ||
            (u.role && u.role.toLowerCase().includes(lowercasedQuery))
        );
    }, [allUsers, searchQuery]);
    
    // Handlers that dispatch actions
    const handleSetActiveTab = (tab: Tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    const handleLikePost = (postId: number) => dispatch({ type: 'LIKE_POST', payload: { postId } });
    const handleSavePost = (postId: number) => dispatch({ type: 'SAVE_POST', payload: { postId } });
    const handleAddComment = (postId: number, text: string) => {
        const newComment: Comment = { id: Date.now(), author: currentUser.name, avatar: currentUser.avatar, text };
        dispatch({ type: 'ADD_COMMENT', payload: { postId, comment: newComment } });
    };
    const handlePost = (content: string, image: string | undefined, forumId: string) => {
        const newPost: Post = { id: Date.now(), author: currentUser.name, avatar: currentUser.avatar, time: 'Just now', content, image, likes: 0, isLiked: false, comments: [], forumId };
        dispatch({ type: 'ADD_POST', payload: newPost });
    };
    
    const handleSaveProject = (data: { id: number | null, title: string, description: string, goals: string, privacy: 'public' | 'private' }) => {
        dispatch({ type: 'SAVE_PROJECT', payload: { ...data, goals: data.goals.split('\n') } });
    };

    const renderView = () => {
        switch (state.activeTab) {
            case 'feed':
                const UserCard: React.FC<{ user: UserProfile }> = ({ user }) => (
                    <div className="bg-surface-dark p-4 rounded-lg shadow-sm border border-border-dark flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
                            <div>
                                <p className="font-bold text-text-primary-dark">{user.name}</p>
                                <p className="text-sm text-text-secondary-dark">{user.role || 'Dental Professional'}</p>
                            </div>
                        </div>
                        <button className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-500 transition-colors text-sm">
                            Follow
                        </button>
                    </div>
                );

                const SearchResultsView = () => (
                    <div className="max-w-3xl mx-auto">
                        <div className="flex border-b border-border-dark mb-6">
                            <button 
                                onClick={() => setSearchTab('posts')}
                                className={`flex-1 py-3 text-center font-semibold transition-colors ${searchTab === 'posts' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
                            >
                                Posts ({searchedPosts.length})
                            </button>
                            <button 
                                onClick={() => setSearchTab('people')}
                                className={`flex-1 py-3 text-center font-semibold transition-colors ${searchTab === 'people' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
                            >
                                People ({searchedPeople.length})
                            </button>
                        </div>
                        
                        {searchTab === 'posts' && (
                            searchedPosts.length > 0 ? (
                                searchedPosts.map(post => <PostCard key={post.id} post={post} onLike={handleLikePost} onAddComment={handleAddComment} onSave={handleSavePost}/>)
                            ) : (
                                <p className="text-center text-text-secondary-dark py-12">No posts found for "{searchQuery}".</p>
                            )
                        )}
            
                        {searchTab === 'people' && (
                            searchedPeople.length > 0 ? (
                                <div className="space-y-4">
                                    {searchedPeople.map(user => <UserCard key={user.id} user={user} />)}
                                </div>
                            ) : (
                                 <p className="text-center text-text-secondary-dark py-12">No people found for "{searchQuery}".</p>
                            )
                        )}
                    </div>
                );

                const FeedView = () => (
                    <div className="max-w-3xl mx-auto">
                        <div className="p-1 bg-background-dark rounded-lg border border-border-dark flex mb-6">
                            <button onClick={() => setFeedFilter('following')} className={`flex-1 px-4 py-1 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${feedFilter === 'following' ? 'bg-border-dark text-text-primary-dark shadow' : 'text-text-secondary-dark'}`}><Users size={16}/> For You</button>
                            <button onClick={() => setFeedFilter('explore')} className={`flex-1 px-4 py-1 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${feedFilter === 'explore' ? 'bg-border-dark text-text-primary-dark shadow' : 'text-text-secondary-dark'}`}><Compass size={16}/> Explore</button>
                            <button onClick={() => setFeedFilter('saved')} className={`flex-1 px-4 py-1 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${feedFilter === 'saved' ? 'bg-border-dark text-text-primary-dark shadow' : 'text-text-secondary-dark'}`}><Bookmark size={16}/> Saved</button>
                        </div>
                        
                        {feedFilter === 'following' && <CreatePost onPost={handlePost} joinedForums={myJoinedForums} />}
                        
                        {filteredFeedPosts.length > 0 ? (
                            filteredFeedPosts.map(post => <PostCard key={post.id} post={post} onLike={handleLikePost} onAddComment={handleAddComment} onSave={handleSavePost}/>)
                        ) : (
                            <div className="text-center text-text-secondary-dark py-12 bg-surface-dark rounded-lg">
                                <p className="font-semibold">No posts to show.</p>
                                <p className="text-sm">Try exploring other posts or joining more forums.</p>
                            </div>
                        )}
                    </div>
                );

                return (
                    <>
                        <div className="max-w-3xl mx-auto mb-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-dark" />
                                <input
                                    type="text"
                                    placeholder="Search posts and people..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-surface-dark border border-border-dark rounded-full py-3 px-12 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                                {searchQuery && (
                                    <button onClick={() => { setSearchQuery(''); setSearchTab('posts'); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary-dark hover:text-white">
                                        <X size={20}/>
                                    </button>
                                )}
                            </div>
                        </div>
                        {searchQuery.trim() ? <SearchResultsView /> : <FeedView />}
                    </>
                );
            case 'forums': return <ForumsView state={state} dispatch={dispatch} />;
            case 'messaging': return <MessagingView state={state} dispatch={dispatch} />;
            case 'projects': return (
                <>
                    <AdvancedProjectsView state={state} dispatch={dispatch} />
                    <ProjectFormModal 
                        isOpen={state.isProjectModalOpen}
                        onClose={() => dispatch({ type: 'CLOSE_PROJECT_MODAL' })}
                        onSubmit={handleSaveProject}
                        projectToEdit={state.projectToEdit}
                    />
                </>
            );
            default: return null;
        }
    };

    return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-text-primary-dark mb-2">DentoMedia Hub</h2>
      <p className="text-text-secondary-dark mb-6">Connect, share, and collaborate with dental professionals worldwide.</p>
      
      <div className="flex border-b border-border-dark -mb-px">
        <TabButton name="feed" label="Feed" icon={<Rss size={16}/>} activeTab={state.activeTab} setActiveTab={handleSetActiveTab} />
        <TabButton name="forums" label="Forums" icon={<MessageSquare size={16}/>} activeTab={state.activeTab} setActiveTab={handleSetActiveTab} />
        <TabButton name="messaging" label="Messaging" icon={<Send size={16}/>} activeTab={state.activeTab} setActiveTab={handleSetActiveTab} />
        <TabButton name="projects" label="Projects" icon={<Briefcase size={16}/>} activeTab={state.activeTab} setActiveTab={handleSetActiveTab} />
      </div>
      
      <div className="mt-6 animate-fade-in">
        {renderView()}
      </div>
    </div>
  );
};