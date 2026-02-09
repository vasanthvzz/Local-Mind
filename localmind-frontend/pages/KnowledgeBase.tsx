import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Sidebar';
import { api } from '@/services/APIService';
import { DocumentGroup, Document, DocFormat } from '../types';
import { FolderPlus, FileText, Upload, BrainCircuit, Calendar, RefreshCw, MoreVertical, X, PanelLeft, Delete, Trash, Edit } from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
    const [groups, setGroups] = useState<DocumentGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<DocumentGroup | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

    // Loading states
    const [isTraining, setIsTraining] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

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

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            localStorage.setItem('lastActiveGroupId', selectedGroup.id);
            loadDocuments(selectedGroup.id);
        } else {
            setDocuments([]);
        }
    }, [selectedGroup]);

    const loadGroups = async () => {
        const data = await api.getGroups();
        setGroups(data);

        // Restore last active group
        const lastId = localStorage.getItem('lastActiveGroupId');
        if (lastId) {
            const found = data.find(g => g.id === lastId);
            if (found) {
                setSelectedGroup(found);
                return;
            }
        }

        // Fallback: If no last group or it was deleted, select the first one if available
        if (data.length > 0 && !selectedGroup) {
            setSelectedGroup(data[0]);
        }
    };

    const loadDocuments = async (groupId: string) => {
        const data = await api.getDocuments(groupId);
        setDocuments(data);
    };

    const handleCreateGroup = async () => {
        if (!newGroupName) return;
        const newGroup = await api.createGroup(newGroupName);
        setGroups(prev => [newGroup, ...prev]);
        setSelectedGroup(newGroup);
        setNewGroupName('');
        setShowCreateModal(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedGroup || !e.target.files?.length) return;
        setIsUploading(true);
        const file = e.target.files[0];
        try {
            await api.addDocument(selectedGroup.id, file);
            await loadDocuments(selectedGroup.id);
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleTrain = async () => {
        if (!selectedGroup) return;
        setIsTraining(true);
        try {
            // await mockApi.trainGroup(selectedGroup.id);
            await api.trainGroup(selectedGroup.id);
            await loadGroups(); // Update timestamps
            // Re-select to update view
            const updated = await api.getGroups();
            setSelectedGroup(updated.find(g => g.id === selectedGroup.id) || null);
        } finally {
            setIsTraining(false);
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!selectedGroup) return;
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await api.deleteDocument(docId);
            await loadDocuments(selectedGroup.id);
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Failed to delete document');
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-black transition-colors duration-300">
            <Navbar />

            <div className="flex-1 flex overflow-hidden">
                {/* Collapsible Groups List Sidebar */}
                <div
                    className={`bg-gray-50 dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-4 opacity-0 overflow-hidden border-none'
                        }`}
                >
                    <div className="p-4 border-b border-gray-100 dark:border-gray-900 flex justify-between items-center min-w-[20rem]">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Groups</h3>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
                            title="New Group"
                        >
                            <FolderPlus className="w-4 h-4 text-black dark:text-white" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 min-w-[20rem]">
                        {groups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => setSelectedGroup(group)}
                                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${selectedGroup?.id === group.id
                                    ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm text-gray-900 dark:text-white'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded flex items-center justify-center ${selectedGroup?.id === group.id ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-sm truncate">{group.name}</div>
                                    <div className="text-[10px] opacity-70 flex items-center gap-1">
                                        {new Date(group.last_trained).toLocaleDateString()}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Documents View Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black transition-colors duration-300">

                    {/* Sticky Header for Main Content */}
                    <header className="h-14 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between px-4 sm:px-8 bg-white/90 dark:bg-black/90 backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors ${!isSidebarOpen ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white' : ''}`}
                                title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                            >
                                <PanelLeft className="w-4 h-4" />
                            </button>

                            {selectedGroup && (
                                <div className="flex items-center gap-3 min-w-0">
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                                        {selectedGroup.name}
                                    </h2>
                                    <span className="hidden sm:inline-flex text-[10px] font-mono font-normal px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                                        ID: {selectedGroup.id.slice(0, 8)}...
                                    </span>
                                </div>
                            )}
                        </div>

                        {selectedGroup && (
                            <div className="flex gap-2 sm:gap-3">
                                <label className={`cursor-pointer px-3 sm:px-4 py-2 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} accept=".pdf,.txt,.doc,.docx" />
                                    {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    <span className="hidden sm:inline">Upload</span>
                                </label>
                                <button
                                    onClick={handleTrain}
                                    disabled={isTraining}
                                    className="px-3 sm:px-4 py-2 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTraining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                                    <span className="hidden sm:inline">Train</span>
                                </button>
                            </div>
                        )}
                    </header>

                    {/* Scrollable Document Grid */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                        {selectedGroup ? (
                            <div className="max-w-5xl mx-auto">
                                <div className="flex items-center gap-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
                                    <BrainCircuit className="w-4 h-4" />
                                    Last trained: {new Date(selectedGroup.last_trained).toLocaleString()}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {documents.length === 0 ? (
                                        <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                                            <div className="w-12 h-12 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-600">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-gray-900 dark:text-white font-medium mb-1">No documents yet</h3>
                                            <p className="text-gray-400 dark:text-gray-500 text-sm">Upload PDF, TXT or DOC files to get started.</p>
                                        </div>
                                    ) : (
                                        documents.map(doc => (
                                            <div key={doc.id} className="bg-white dark:bg-black hover:shadow-md border border-gray-200 dark:border-gray-800 rounded-xl p-4 transition-all group relative">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className={`p-2 rounded-lg ${doc.format === DocFormat.PDF ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400' :
                                                        doc.format === DocFormat.DOC ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' :
                                                            'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <button className="text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => null}>
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteDocument(doc.id)}>
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h4 className="text-gray-900 dark:text-white font-medium text-sm truncate mb-1" title={doc.name}>{doc.name}</h4>
                                                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                                    <span className="uppercase tracking-wider">{doc.format}</span>
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-700">
                                <FolderPlus className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-gray-400 dark:text-gray-600 font-medium">Select a document group to view files</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Document Group</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none mb-6 placeholder-gray-300 dark:placeholder-gray-700"
                            placeholder="Group Name (e.g. Legal Docs)"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={!newGroupName}
                                className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-lg font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};