import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Sidebar';
import { ChatInterface } from '../components/ChatInterface';
import { Conversation, DocumentGroup, QueryType } from '../types';
import { Search, Cpu, BookOpen, Layers, X, Check, Database, Trash2 } from 'lucide-react';
import { api } from '@/services/APIService';

export const ChatPage: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(localStorage.getItem('lastActiveConversationId'));
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);

    // Sidebar visibility state - default to open on large screens
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

    // Save activeId to localStorage
    useEffect(() => {
        if (activeId) {
            localStorage.setItem('lastActiveConversationId', activeId);
        } else {
            localStorage.removeItem('lastActiveConversationId');
        }
    }, [activeId]);

    // New Chat Form State
    const [newChatTitle, setNewChatTitle] = useState('');
    const [newChatType, setNewChatType] = useState<QueryType>(QueryType.GENERAL);

    // Knowledge Base Selection
    const [availableGroups, setAvailableGroups] = useState<DocumentGroup[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

    // Adaptive Sidebar Logic
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const refreshList = async () => {
        const data = await api.getConversations();
        setConversations(data);
    };

    useEffect(() => {
        refreshList();
        api.getGroups().then(setAvailableGroups);
    }, []);

    const handleOpenNewChat = () => {
        setNewChatTitle('');
        setNewChatType(QueryType.GENERAL);
        setSelectedGroupIds([]);
        api.getGroups().then(setAvailableGroups);
        setShowNewChatModal(true);
    };

    const createChat = async () => {
        if (!newChatTitle) return;
        if (newChatType !== QueryType.GENERAL && selectedGroupIds.length === 0) return;

        const newConv = await api.createConversation(newChatTitle, newChatType, selectedGroupIds);
        if (!newConv) return; // Guard against failure

        // Force local timestamp update to ensure it appears at the top immediately
        const convWithCurrentTime = {
            ...newConv,
            updated_at: new Date().toISOString()
        };

        setConversations(prev => [convWithCurrentTime, ...prev]);
        setActiveId(newConv.id);
        setShowNewChatModal(false);
        // Ensure sidebar is open when creating new chat
        setIsSidebarOpen(true);
    };

    const deleteChat = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (confirm('Are you sure you want to delete this conversation?')) {
            await api.deleteConversation(id);
            if (activeId === id) setActiveId(null);
            refreshList();
        }
    };

    const toggleGroupSelection = (id: string) => {
        setSelectedGroupIds(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const filteredConversations = conversations
        ?.filter(c => c && c.updated_at)
        ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        ?? [];
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-black transition-colors duration-300">
            <Navbar onNewChat={handleOpenNewChat} />

            <div className="flex-1 flex overflow-hidden">
                {/* Collapsible Conversation List Sidebar */}
                <div
                    className={`bg-gray-50 dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-4 opacity-0 overflow-hidden border-none'
                        }`}
                >
                    <div className="p-4 border-b border-gray-100 dark:border-gray-900 min-w-[20rem]">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all placeholder-gray-400 dark:placeholder-gray-600"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 min-w-[20rem]">
                        {filteredConversations.length === 0 && (
                            <div className="text-center text-gray-400 dark:text-gray-600 text-sm mt-10">No conversations found</div>
                        )}
                        {filteredConversations.map(conv => (
                            <div key={conv.id} className="group relative">
                                <button
                                    onClick={() => setActiveId(conv.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all pr-10 ${activeId === conv.id
                                        ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm'
                                        : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${conv.conv_type === 'strict_rag' ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/20' :
                                            conv.conv_type === 'rag' ? 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/20' :
                                                'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/20'
                                            }`}>
                                            {conv.conv_type === 'strict_rag' ? 'STRICT' : conv.conv_type}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-600">
                                            {new Date(conv.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className={`font-medium text-sm truncate ${activeId === conv.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {conv.title}
                                    </h3>
                                </button>

                                {/* Delete Button inside box */}
                                <button
                                    onClick={(e) => deleteChat(conv.id, e)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Chat Area */}
                <ChatInterface
                    activeConversationId={activeId}
                    onNewChat={handleOpenNewChat}
                    onDeleteChat={(id) => deleteChat(id)}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Start Conversation</h3>
                            <button onClick={() => setShowNewChatModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Title</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                    placeholder="e.g., Project Alpha Analysis"
                                    value={newChatTitle}
                                    onChange={e => setNewChatTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Mode</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setNewChatType(QueryType.GENERAL)}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${newChatType === QueryType.GENERAL
                                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-md'
                                            : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                                            }`}
                                    >
                                        <Cpu className="w-5 h-5" />
                                        <span className="text-xs font-bold">General</span>
                                    </button>
                                    <button
                                        onClick={() => setNewChatType(QueryType.RAG)}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${newChatType === QueryType.RAG
                                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-md'
                                            : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                                            }`}
                                    >
                                        <Layers className="w-5 h-5" />
                                        <span className="text-xs font-bold">RAG</span>
                                    </button>
                                    <button
                                        onClick={() => setNewChatType(QueryType.STRICT_RAG)}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${newChatType === QueryType.STRICT_RAG
                                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-md'
                                            : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                                            }`}
                                    >
                                        <BookOpen className="w-5 h-5" />
                                        <span className="text-xs font-bold">Strict</span>
                                    </button>
                                </div>
                            </div>

                            {newChatType !== QueryType.GENERAL && (
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Include Knowledge Bases</label>
                                    {availableGroups.length === 0 ? (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400">
                                            No knowledge bases available.
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                            {availableGroups.map(group => (
                                                <button
                                                    key={group.id}
                                                    onClick={() => toggleGroupSelection(group.id)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedGroupIds.includes(group.id)
                                                        ? 'bg-gray-50 dark:bg-gray-900 border-black dark:border-white text-gray-900 dark:text-white'
                                                        : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Database className="w-4 h-4 opacity-70" />
                                                        <span className="text-sm font-medium">{group.name}</span>
                                                    </div>
                                                    {selectedGroupIds.includes(group.id) && <Check className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mt-2">
                                        <p className="text-[10px] text-gray-400">
                                            Selected groups will be used as context for the model.
                                        </p>
                                        {selectedGroupIds.length === 0 && (
                                            <p className="text-[10px] text-red-500 font-medium">
                                                * Required
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowNewChatModal(false)}
                                className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createChat}
                                disabled={!newChatTitle || (newChatType !== QueryType.GENERAL && selectedGroupIds.length === 0)}
                                className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed text-white dark:text-black px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                Start Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};