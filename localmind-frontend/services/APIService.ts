import {
    Conversation,
    Message,
    DocumentGroup,
    Document,
    QueryType,
    SenderType
} from '../types';

const API_BASE = 'http://localhost:8000/api';

// Helper to attempt real API call, falling back to mock if it fails
async function withFallback<T>(
    realCall: () => Promise<T>,
    fallbackCall: () => Promise<T>
): Promise<T> {
    try {
        return await realCall();
    } catch (error) {
        console.warn(`Backend API failed (FastAPI), falling back to Mock.`, error);
        return await fallbackCall();
    }
}

export const api = {
    // --- Conversations ---

    getConversations: async (): Promise<Conversation[]> => {
        return withFallback(
            async () => {
                const res = await fetch(`${API_BASE}/conversation/`);
                if (!res.ok) throw new Error('Failed to fetch conversations');
                return res.json();
            },
            () => Promise.resolve([])
        );
    },

    getConversation: async (id: string): Promise<Conversation> => {
        return withFallback(
            async () => {
                const res = await fetch(`${API_BASE}/conversation/${id}`);
                if (!res.ok) throw new Error('Failed to fetch conversation');
                return res.json();
            },
            () => Promise.resolve(null)
        );
    },

    createConversation: async (title: string, type: QueryType, groupIds: string[] = []): Promise<Conversation> => {
        return withFallback(
            async () => {
                const res = await fetch(`${API_BASE}/conversation/new`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: title, conv_type: type, group_ids: groupIds })
                });
                if (!res.ok) throw new Error('Failed to create conversation');
                return res.json();
            },
            () => Promise.resolve({
                id: crypto.randomUUID(),
                title: title,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                conv_type: type,
                groupIds: groupIds
            })
        );
    },

    deleteConversation: async (id: string): Promise<void> => {
        return withFallback(
            async () => {
                const res = await fetch(`${API_BASE}/conversation/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete conversation');
            },
            () => Promise.resolve()
        );
    },

    // --- Messages ---

    getMessages: async (conversationId: string): Promise<Message[]> => {
        return withFallback(
            async () => {
                const res = await fetch(`${API_BASE}/chat/${conversationId}/all`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    }
                );
                if (!res.ok) {
                    if (res.status === 404) return [];
                    throw new Error('Failed to fetch messages');
                }
                const data: Message[] = await res.json();
                return data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            },
            () => Promise.resolve([])
        );
    },
    sendMessageStream: async (
        conversationId: string,
        text: string,
        type: QueryType = QueryType.GENERAL,
        onChunk: (chunk: string) => void,
        signal?: AbortSignal
    ): Promise<{ userMessage: Message, assistantId: string | null }> => {

        // Logic: Try Real API Stream first. If connection fails immediately, fall back to Mock Stream.
        try {
            console.log("Initiating stream request for conversation:", conversationId);
            const res = await fetch(`${API_BASE}/chat/${conversationId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
                signal
            });

            console.log("Response headers received", res.status);

            if (!res.ok) {
                const errText = await res.text();
                console.error("Stream request failed:", res.status, errText);
                throw new Error(`Failed to initiate stream: ${res.statusText} ${errText}`);
            }
            if (!res.body) throw new Error('ReadableStream not supported');

            // Get IDs from backend headers
            // Ensure backend sends: Access-Control-Expose-Headers: x-user-message-id, x-assistant-message-id
            const backendUserMsgId = res.headers.get('x-user-message-id') || res.headers.get('x-message-id');
            const backendAssistantMsgId = res.headers.get('x-assistant-message-id');

            console.log("Headers - UserID:", backendUserMsgId, "AssistantID:", backendAssistantMsgId);

            // Optimistically create the User message to return
            const optimisticUserMsg: Message = {
                id: backendUserMsgId || crypto.randomUUID(),
                conversation_id: conversationId,
                text,
                sender: SenderType.USER,
                created_at: new Date().toISOString()
            };

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            // Start reading (awaited, so we block until stream is done)
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    onChunk(chunk);
                }
                console.log("Stream reading complete");
            } catch (e) {
                console.error("Error reading stream", e);
                throw e; // Re-throw to be caught by caller
            }

            return { userMessage: optimisticUserMsg, assistantId: backendAssistantMsgId };

        } catch (error) {
            console.warn('Real API Stream failed, using Mock stream', error);
            throw error; // Propagate error to let caller handle rollback
        }
    },

    // sendMessage: async (conversationId: string, text: string, type: QueryType): Promise<Message> => {
    //     return withFallback(
    //         async () => {
    //             const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({ text, type })
    //             });
    //             if (!res.ok) throw new Error('Failed to send message');
    //             return res.json();
    //         },
    //         () => null
    //     );
    // },

    // Helper to poll for AI response 
    // In fallback mode, it uses the mock logic. In real mode, it just polls the endpoint.
    pollLatestMessage: async (conversationId: string): Promise<Message | null> => {
        return withFallback(
            async () => {
                const msgs = await api.getMessages(conversationId);
                const last = msgs[msgs.length - 1];
                if (last && last.sender === 'assistant') {
                    return last;
                }
                return null;
            },
            () => Promise.resolve(null)
        );
    },

    // --- Groups ---

    getGroups: async (): Promise<DocumentGroup[]> => {
        return withFallback(
            async () => {
                const res = await fetch(`${API_BASE}/document_group/groups`);
                if (!res.ok) throw new Error('Failed to fetch groups');
                return res.json();
            },
            () => Promise.resolve([])
        );
    },

    createGroup: async (name: string): Promise<DocumentGroup> => {
        return withFallback(
            async () => {
                const res = await fetch(`${API_BASE}/document_group/new/${name}`, {
                    method: 'POST'
                });
                if (!res.ok) throw new Error('Failed to create group');
                return res.json();
            },
            () => Promise.resolve()
        );
    },

    trainGroup: async (groupId: string): Promise<void> => {
        return withFallback(
            async () => {
                const res = await fetch(`${API_BASE}/document_group/${groupId}/train`, { method: 'POST' });
                if (!res.ok) throw new Error('Failed to train group');
            },
            () => Promise.resolve()
        );
    },

    // --- Documents ---

    getDocuments: async (groupId: string): Promise<Document[]> => {
        return withFallback(
            async () => {
                const res = await fetch(`${API_BASE}/document_group/${groupId}/documents`);
                if (!res.ok) throw new Error('Failed to fetch documents');
                return res.json();
            },
            () => Promise.resolve([])
        );
    },

    addDocument: async (groupId: string, file: File): Promise<Document> => {
        return withFallback(
            async () => {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch(`${API_BASE}/document/${groupId}/upload`, {
                    method: 'POST',
                    body: formData
                });
                if (!res.ok) throw new Error('Failed to upload document');
                return res.json();
            },
            () => Promise.resolve(null as any)
        );
    },

    deleteDocument: async (documentId: string): Promise<void> => {
        return withFallback(
            async () => {
                const res = await fetch(`${API_BASE}/document/${documentId}`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Failed to delete document');
            },
            () => Promise.resolve()
        );
    }
};