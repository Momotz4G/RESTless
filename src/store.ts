import { create } from 'zustand';
import { db, type SavedRequest, type Collection, type HistoryEntry, type AuthConfig } from './db';
import { generateAwsSignature, generateDigestAuthHeader } from './authHelpers';

export type KeyValuePair = { id: string; key: string; value: string; active: boolean };

export interface Tab {
  id: string;
  name: string;
  method: string;
  url: string;
  queryParams: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  auth: AuthConfig;
  savedRequestId?: number;
  // response state per tab
  isLoading: boolean;
  response: string | null;
  responseHeaders: Record<string, string>;
  responseStatus: number | null;
  responseTime: number | null;
  responseSize: number | null;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyTab = (): Tab => ({
  id: generateId(),
  name: 'New Request',
  method: 'GET',
  url: '',
  queryParams: [{ id: generateId(), key: '', value: '', active: true }],
  headers: [{ id: generateId(), key: '', value: '', active: true }],
  body: '{\n  \n}',
  auth: {
    type: 'none',
    bearerToken: '',
    basicUsername: '',
    basicPassword: '',
    apiKeyKey: '',
    apiKeyValue: '',
    apiKeyAddTo: 'header',
    oauth2Token: '',
    awsAccessKey: '',
    awsSecretKey: '',
    awsRegion: 'us-east-1',
    awsService: 'execute-api',
    digestUsername: '',
    digestPassword: '',
  },
  isLoading: false,
  response: null,
  responseHeaders: {},
  responseStatus: null,
  responseTime: null,
  responseSize: null,
});

interface AppState {
  // Tabs
  tabs: Tab[];
  activeTabId: string;
  addTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;

  // Request Tab Panel
  requestPanelTab: string;
  setRequestPanelTab: (tab: string) => void;

  // Response Tab Panel
  responsePanelTab: string;
  setResponsePanelTab: (tab: string) => void;

  // Collections
  collections: Collection[];
  loadCollections: () => Promise<void>;
  addCollection: (name: string) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  renameCollection: (id: number, name: string) => Promise<void>;

  // Saved Requests
  savedRequests: SavedRequest[];
  loadSavedRequests: () => Promise<void>;
  saveRequest: (collectionId: number) => Promise<void>;
  deleteSavedRequest: (id: number) => Promise<void>;
  openSavedRequest: (req: SavedRequest) => void;

  // History
  history: HistoryEntry[];
  loadHistory: () => Promise<void>;
  addToHistory: (entry: Omit<HistoryEntry, 'id'>) => Promise<void>;
  clearHistory: () => Promise<void>;
  openHistoryEntry: (entry: HistoryEntry) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Sidebar
  sidebarSection: 'collections' | 'history';
  setSidebarSection: (s: 'collections' | 'history') => void;

  // Send Request
  sendRequest: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Tabs
  tabs: [createEmptyTab()],
  activeTabId: '',
  addTab: () => {
    const newTab = createEmptyTab();
    set((s) => ({ tabs: [...s.tabs, newTab], activeTabId: newTab.id }));
  },
  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    let newActiveId = activeTabId;
    if (activeTabId === id) {
      newActiveId = newTabs[Math.min(idx, newTabs.length - 1)].id;
    }
    set({ tabs: newTabs, activeTabId: newActiveId });
  },
  setActiveTab: (id) => set({ activeTabId: id }),
  updateTab: (id, updates) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  // Request Panel
  requestPanelTab: 'Params',
  setRequestPanelTab: (tab) => set({ requestPanelTab: tab }),

  // Response Panel
  responsePanelTab: 'Body',
  setResponsePanelTab: (tab) => set({ responsePanelTab: tab }),

  // Collections
  collections: [],
  loadCollections: async () => {
    const collections = await db.collections.orderBy('createdAt').reverse().toArray();
    set({ collections });
  },
  addCollection: async (name) => {
    await db.collections.add({ name, createdAt: Date.now() });
    await get().loadCollections();
  },
  deleteCollection: async (id) => {
    await db.collections.delete(id);
    await db.requests.where('collectionId').equals(id).delete();
    await get().loadCollections();
    await get().loadSavedRequests();
  },
  renameCollection: async (id, name) => {
    await db.collections.update(id, { name });
    await get().loadCollections();
  },

  // Saved Requests
  savedRequests: [],
  loadSavedRequests: async () => {
    const savedRequests = await db.requests.orderBy('updatedAt').reverse().toArray();
    set({ savedRequests });
  },
  saveRequest: async (collectionId) => {
    const tab = get().tabs.find((t) => t.id === get().activeTabId);
    if (!tab) return;
    const now = Date.now();
    const data: SavedRequest = {
      name: tab.name === 'New Request' ? (tab.url || 'Untitled') : tab.name,
      method: tab.method,
      url: tab.url,
      queryParams: tab.queryParams.filter((p) => p.key).map(({ id: _id, ...rest }) => rest),
      headers: tab.headers.filter((h) => h.key).map(({ id: _id, ...rest }) => rest),
      body: tab.body,
      auth: tab.auth,
      collectionId,
      createdAt: now,
      updatedAt: now,
    };
    if (tab.savedRequestId) {
      await db.requests.update(tab.savedRequestId, { ...data, createdAt: undefined, updatedAt: now });
    } else {
      const newId = await db.requests.add(data);
      get().updateTab(tab.id, { savedRequestId: newId as number, name: data.name });
    }
    await get().loadSavedRequests();
  },
  deleteSavedRequest: async (id) => {
    await db.requests.delete(id);
    await get().loadSavedRequests();
  },
  openSavedRequest: (req) => {
    const existingTab = get().tabs.find((t) => t.savedRequestId === req.id);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }
    const newTab: Tab = {
      id: generateId(),
      name: req.name,
      method: req.method,
      url: req.url,
      queryParams: [...req.queryParams.map((p) => ({ ...p, id: generateId() })), { id: generateId(), key: '', value: '', active: true }],
      headers: [...req.headers.map((h) => ({ ...h, id: generateId() })), { id: generateId(), key: '', value: '', active: true }],
      body: req.body,
      auth: req.auth || createEmptyTab().auth,
      savedRequestId: req.id,
      isLoading: false,
      response: null,
      responseHeaders: {},
      responseStatus: null,
      responseTime: null,
      responseSize: null,
    };
    set((s) => ({ tabs: [...s.tabs, newTab], activeTabId: newTab.id }));
  },

  // History
  history: [],
  loadHistory: async () => {
    const history = await db.history.orderBy('timestamp').reverse().limit(50).toArray();
    set({ history });
  },
  addToHistory: async (entry) => {
    await db.history.add(entry as HistoryEntry);
    await get().loadHistory();
  },
  clearHistory: async () => {
    await db.history.clear();
    set({ history: [] });
  },
  openHistoryEntry: (entry) => {
    const newTab: Tab = {
      id: generateId(),
      name: entry.url,
      method: entry.method,
      url: entry.url,
      queryParams: [...(entry.queryParams || []).map((p) => ({ ...p, id: generateId() })), { id: generateId(), key: '', value: '', active: true }],
      headers: [...(entry.headers || []).map((h) => ({ ...h, id: generateId() })), { id: generateId(), key: '', value: '', active: true }],
      body: entry.body || '',
      auth: entry.auth || createEmptyTab().auth,
      isLoading: false,
      response: entry.responseBody,
      responseHeaders: entry.responseHeaders || {},
      responseStatus: entry.statusCode,
      responseTime: entry.responseTime,
      responseSize: entry.responseBody ? new Blob([entry.responseBody]).size : null,
    };
    set((s) => ({ tabs: [...s.tabs, newTab], activeTabId: newTab.id }));
  },

  // Search
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  // Sidebar
  sidebarSection: 'collections',
  setSidebarSection: (s) => set({ sidebarSection: s }),

  // Send Request
  sendRequest: async () => {
    const { activeTabId, updateTab, addToHistory } = get();
    const tab = get().tabs.find((t) => t.id === activeTabId);
    if (!tab || !tab.url) return;

    updateTab(activeTabId, {
      isLoading: true,
      response: null,
      responseHeaders: {},
      responseStatus: null,
      responseTime: null,
      responseSize: null,
    });

    let fetchHeaders: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
    };
    tab.headers.forEach((h) => {
      if (h.active && h.key.trim()) fetchHeaders[h.key.trim()] = h.value.trim();
    });

    if (tab.auth.type === 'bearer' && tab.auth.bearerToken.trim()) {
      fetchHeaders['Authorization'] = `Bearer ${tab.auth.bearerToken.trim()}`;
    } else if (tab.auth.type === 'oauth2' && tab.auth.oauth2Token.trim()) {
      fetchHeaders['Authorization'] = `Bearer ${tab.auth.oauth2Token.trim()}`;
    } else if (tab.auth.type === 'basic' && (tab.auth.basicUsername || tab.auth.basicPassword)) {
      fetchHeaders['Authorization'] = `Basic ${btoa(`${tab.auth.basicUsername}:${tab.auth.basicPassword}`)}`;
    } else if (tab.auth.type === 'apiKey' && tab.auth.apiKeyKey.trim() && tab.auth.apiKeyValue.trim() && tab.auth.apiKeyAddTo === 'header') {
      fetchHeaders[tab.auth.apiKeyKey.trim()] = tab.auth.apiKeyValue.trim();
    }

    let finalUrl = tab.url;
    try {
      const urlObj = new URL(tab.url.startsWith('http') ? tab.url : `http://${tab.url}`);
      tab.queryParams.forEach((p) => {
        if (p.active && p.key.trim()) urlObj.searchParams.append(p.key.trim(), p.value.trim());
      });
      if (tab.auth.type === 'apiKey' && tab.auth.apiKeyKey.trim() && tab.auth.apiKeyValue.trim() && tab.auth.apiKeyAddTo === 'queryParams') {
        urlObj.searchParams.append(tab.auth.apiKeyKey.trim(), tab.auth.apiKeyValue.trim());
      }
      finalUrl = urlObj.toString();
    } catch {
      // ignored
    }

    const startTime = performance.now();
    try {
      const options: RequestInit = { method: tab.method };
      if (tab.method !== 'GET' && tab.method !== 'HEAD' && tab.body.trim()) {
        options.body = tab.body;
        if (!fetchHeaders['Content-Type']) {
          fetchHeaders['Content-Type'] = 'application/json';
        }
      }

      if (tab.auth.type === 'aws' && tab.auth.awsAccessKey && tab.auth.awsSecretKey) {
        fetchHeaders = generateAwsSignature(
          tab.method,
          finalUrl,
          fetchHeaders,
          tab.body.trim(),
          tab.auth.awsAccessKey.trim(),
          tab.auth.awsSecretKey.trim(),
          tab.auth.awsRegion.trim() || 'us-east-1',
          tab.auth.awsService.trim() || 'execute-api'
        );
      }

      options.headers = fetchHeaders;

      let res = await fetch(finalUrl, options);
      
      // Handle Digest Auth 401 Challenge
      if (res.status === 401 && tab.auth.type === 'digest' && tab.auth.digestUsername && tab.auth.digestPassword) {
        const wwwAuth = res.headers.get('www-authenticate');
        if (wwwAuth && wwwAuth.toLowerCase().startsWith('digest')) {
          const digestHeader = generateDigestAuthHeader(
            tab.method,
            finalUrl,
            wwwAuth,
            tab.auth.digestUsername,
            tab.auth.digestPassword
          );
          options.headers = { ...fetchHeaders, 'Authorization': digestHeader };
          res = await fetch(finalUrl, options); // Retry
        }
      }
      const endTime = performance.now();
      const resTime = Math.round(endTime - startTime);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => (resHeaders[k] = v));

      const textData = await res.text();
      const size = new Blob([textData]).size;
      let formattedResponse: string;
      try {
        formattedResponse = JSON.stringify(JSON.parse(textData), null, 2);
      } catch {
        formattedResponse = textData;
      }

      updateTab(activeTabId, {
        isLoading: false,
        response: formattedResponse,
        responseHeaders: resHeaders,
        responseStatus: res.status,
        responseTime: resTime,
        responseSize: size,
      });

      await addToHistory({
        method: tab.method,
        url: tab.url,
        statusCode: res.status,
        responseTime: resTime,
        queryParams: tab.queryParams.filter((p) => p.key).map(({ id: _id, ...rest }) => rest),
        headers: tab.headers.filter((h) => h.key).map(({ id: _id, ...rest }) => rest),
        body: tab.body,
        auth: tab.auth,
        responseBody: formattedResponse,
        responseHeaders: resHeaders,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      const endTime = performance.now();
      updateTab(activeTabId, {
        isLoading: false,
        response: `Error: ${err.message || 'Unknown error'}\n\nIf running in a browser, this may be a CORS issue.\nUse the Tauri desktop app to bypass CORS.`,
        responseHeaders: {},
        responseStatus: 0,
        responseTime: Math.round(endTime - startTime),
        responseSize: null,
      });

      await addToHistory({
        method: tab.method,
        url: tab.url,
        statusCode: 0,
        responseTime: Math.round(endTime - startTime),
        queryParams: tab.queryParams.filter((p) => p.key).map(({ id: _id, ...rest }) => rest),
        headers: tab.headers.filter((h) => h.key).map(({ id: _id, ...rest }) => rest),
        body: tab.body,
        auth: tab.auth,
        responseBody: err.message || 'Error',
        responseHeaders: {},
        timestamp: Date.now(),
      });
    }
  },
}));

// Initialize
useAppStore.getState().activeTabId = useAppStore.getState().tabs[0].id;
