import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Play, Plus, Folder, FolderOpen, Search, Trash2, X, ChevronRight, ChevronDown,
  Clock, Save, History, Layers, ExternalLink, Image as ImageIcon, Copy, Check
} from 'lucide-react';
import { useAppStore, type KeyValuePair } from './store';

const generateId = () => Math.random().toString(36).substring(2, 9);

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-amber-400',
  PUT: 'text-blue-400',
  PATCH: 'text-purple-400',
  DELETE: 'text-red-400',
  HEAD: 'text-cyan-400',
  OPTIONS: 'text-gray-400',
};

const STATUS_TEXT: Record<number, string> = {
  200: 'OK', 201: 'Created', 204: 'No Content',
  301: 'Moved', 302: 'Found', 304: 'Not Modified',
  400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 405: 'Method Not Allowed',
  500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
};

/* ── Key-Value Editor ──────────────────────────────────────────── */
function KeyValueEditor({ items, onChange }: { items: KeyValuePair[]; onChange: (items: KeyValuePair[]) => void }) {
  const updateItem = (id: string, field: keyof KeyValuePair, value: any) => {
    const updated = items.map((item) => (item.id === id ? { ...item, [field]: value } : item));
    onChange(updated);
    const last = items[items.length - 1];
    if (last.id === id && (field === 'key' || field === 'value') && value !== '') {
      onChange([...updated, { id: generateId(), key: '', value: '', active: true }]);
    }
  };
  const removeItem = (id: string) => {
    if (items.length > 1) onChange(items.filter((i) => i.id !== id));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2 items-center px-1 mb-1">
        <span className="w-5" />
        <span className="flex-1 text-[11px] uppercase tracking-wider text-text-muted/60 font-medium">Key</span>
        <span className="flex-1 text-[11px] uppercase tracking-wider text-text-muted/60 font-medium">Value</span>
        <span className="w-8" />
      </div>
      {items.map((item) => (
        <div key={item.id} className="flex gap-2 items-center group">
          <input
            type="checkbox"
            checked={item.active}
            onChange={(e) => updateItem(item.id, 'active', e.target.checked)}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer shrink-0"
          />
          <input
            type="text"
            value={item.key}
            onChange={(e) => updateItem(item.id, 'key', e.target.value)}
            placeholder="Key"
            className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => updateItem(item.id, 'value', e.target.value)}
            placeholder="Value"
            className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button
            onClick={() => removeItem(item.id)}
            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Auth Editor ───────────────────────────────────────────────── */
function AuthEditor({ activeTab }: { activeTab: any }) {
  const { updateTab } = useAppStore();
  const auth = activeTab.auth;

  const updateAuth = (updates: Partial<typeof auth>) => {
    updateTab(activeTab.id, { auth: { ...auth, ...updates } });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text-muted w-24">Type</label>
        <select
          value={auth.type}
          onChange={(e) => updateAuth({ type: e.target.value as any })}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apiKey">API Key</option>
          <option value="oauth2">OAuth 2.0</option>
          <option value="aws">AWS Signature</option>
          <option value="digest">Digest Auth</option>
        </select>
      </div>

      {auth.type === 'bearer' && (
        <div className="flex items-start gap-3">
          <label className="text-sm font-medium text-text-muted w-24 pt-2">Token</label>
          <textarea
            value={auth.bearerToken}
            onChange={(e) => updateAuth({ bearerToken: e.target.value })}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="flex-1 h-24 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none"
            spellCheck={false}
          />
        </div>
      )}

      {auth.type === 'basic' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">Username</label>
            <input
              type="text"
              value={auth.basicUsername}
              onChange={(e) => updateAuth({ basicUsername: e.target.value })}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">Password</label>
            <input
              type="password"
              value={auth.basicPassword}
              onChange={(e) => updateAuth({ basicPassword: e.target.value })}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      )}

      {auth.type === 'apiKey' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">Key</label>
            <input
              type="text"
              value={auth.apiKeyKey}
              onChange={(e) => updateAuth({ apiKeyKey: e.target.value })}
              placeholder="x-api-key"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">Value</label>
            <input
              type="text"
              value={auth.apiKeyValue}
              onChange={(e) => updateAuth({ apiKeyValue: e.target.value })}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">Add to</label>
            <select
              value={auth.apiKeyAddTo}
              onChange={(e) => updateAuth({ apiKeyAddTo: e.target.value as any })}
              className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="header">Header</option>
              <option value="queryParams">Query Params</option>
            </select>
          </div>
        </div>
      )}

      {auth.type === 'oauth2' && (
        <div className="flex items-start gap-3">
          <label className="text-sm font-medium text-text-muted w-24 pt-2">Access Token</label>
          <textarea
            value={auth.oauth2Token}
            onChange={(e) => updateAuth({ oauth2Token: e.target.value })}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="flex-1 h-24 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none"
            spellCheck={false}
          />
        </div>
      )}

      {auth.type === 'aws' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">Access Key</label>
            <input
              type="text"
              value={auth.awsAccessKey}
              onChange={(e) => updateAuth({ awsAccessKey: e.target.value })}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">Secret Key</label>
            <input
              type="password"
              value={auth.awsSecretKey}
              onChange={(e) => updateAuth({ awsSecretKey: e.target.value })}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">AWS Region</label>
            <input
              type="text"
              value={auth.awsRegion}
              onChange={(e) => updateAuth({ awsRegion: e.target.value })}
              placeholder="us-east-1"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">Service Name</label>
            <input
              type="text"
              value={auth.awsService}
              onChange={(e) => updateAuth({ awsService: e.target.value })}
              placeholder="execute-api"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      )}

      {auth.type === 'digest' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">Username</label>
            <input
              type="text"
              value={auth.digestUsername}
              onChange={(e) => updateAuth({ digestUsername: e.target.value })}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-muted w-24">Password</label>
            <input
              type="password"
              value={auth.digestPassword}
              onChange={(e) => updateAuth({ digestPassword: e.target.value })}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <p className="text-xs text-text-muted/70 pl-27">
            RESTless will automatically handle the initial 401 challenge and retry with the correct MD5 hash response.
          </p>
        </div>
      )}

      {auth.type === 'none' && (
        <div className="text-sm text-text-muted/50 italic mt-4">
          This request does not use any authorization.
        </div>
      )}
    </div>
  );
}

/* ── URL Detection Helpers ─────────────────────────────────────── */
const URL_REGEX = /(https?:\/\/[^\s"',\]\)]+)/g;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;
const IMAGE_HOSTS = /\b(scdn\.co|spotifycdn\.com|i\.scdn\.co|i2o\.scdn\.co|image-cdn)\b/i;

function isImageUrl(url: string): boolean {
  return IMAGE_EXTENSIONS.test(url) || IMAGE_HOSTS.test(url);
}

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ? [...new Set(matches)] : [];
}

/* ── Smart Response Body Renderer ─────────────────────────────── */
function ResponseBody({ text }: { text: string }) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const urls = useMemo(() => extractUrls(text), [text]);
  const imageUrls = useMemo(() => urls.filter(u => isImageUrl(u)), [urls]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const toggleImage = (url: string) => {
    setExpandedImages(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  };

  // Render text with clickable URLs
  const renderWithLinks = (content: string) => {
    const parts = content.split(URL_REGEX);
    return parts.map((part, i) => {
      if (URL_REGEX.test(part)) {
        URL_REGEX.lastIndex = 0;
        const isImage = isImageUrl(part);
        return (
          <span key={i} className="inline">
            <span className="inline-flex items-center gap-0">
              <a
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline decoration-dotted underline-offset-2 hover:decoration-solid transition-colors ${
                  isImage ? 'text-emerald-400 hover:text-emerald-300' : 'text-blue-400 hover:text-blue-300'
                }`}
                title={isImage ? 'Image URL — Click to open' : 'Click to open in browser'}
              >
                {part}
              </a>
              <button
                onClick={() => copyUrl(part)}
                className="inline-flex items-center ml-1 p-0.5 rounded text-text-muted/40 hover:text-text-muted transition-colors"
                title="Copy URL"
              >
                {copiedUrl === part ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              {isImage && !failedImages.has(part) && (
                <button
                  onClick={() => toggleImage(part)}
                  className="inline-flex items-center p-0.5 rounded text-text-muted/40 hover:text-emerald-400 transition-colors"
                  title="Toggle image preview"
                >
                  <ImageIcon className="w-3 h-3" />
                </button>
              )}
            </span>
            {isImage && expandedImages.has(part) && !failedImages.has(part) && (
              <span className="block my-2 ml-4">
                <span className="inline-block rounded-lg overflow-hidden border border-border/50 bg-background shadow-lg">
                  <img
                    src={part}
                    alt="Preview"
                    className="max-w-sm max-h-48 object-contain"
                    onError={() => setFailedImages(prev => new Set(prev).add(part))}
                  />
                </span>
              </span>
            )}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div>
      <pre className="p-4 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed text-text/80">
        {renderWithLinks(text)}
      </pre>

      {/* Inline image gallery at the bottom */}
      {imageUrls.length > 0 && (
        <div className="border-t border-border/30 mx-4 pt-3 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {imageUrls.length} Image{imageUrls.length > 1 ? 's' : ''} Detected
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {imageUrls.filter(u => !failedImages.has(u)).map((imgUrl, idx) => (
              <div key={idx} className="group relative rounded-lg overflow-hidden border border-border/50 bg-background shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                <img
                  src={imgUrl}
                  alt={`Response image ${idx + 1}`}
                  className="max-w-[200px] max-h-[120px] object-cover"
                  onError={() => setFailedImages(prev => new Set(prev).add(imgUrl))}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <a
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white/20 backdrop-blur-sm rounded-md hover:bg-white/30 transition-colors"
                    title="Open full size"
                  >
                    <ExternalLink className="w-4 h-4 text-white" />
                  </a>
                  <button
                    onClick={() => copyUrl(imgUrl)}
                    className="p-1.5 bg-white/20 backdrop-blur-sm rounded-md hover:bg-white/30 transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl === imgUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Image Preview Tab ─────────────────────────────────────────── */
function ResponsePreview({ text }: { text: string }) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const urls = useMemo(() => extractUrls(text), [text]);
  const imageUrls = useMemo(() => urls.filter(u => isImageUrl(u)), [urls]);
  const nonImageUrls = useMemo(() => urls.filter(u => !isImageUrl(u)), [urls]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Images */}
      {imageUrls.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-text">Images ({imageUrls.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {imageUrls.filter(u => !failedImages.has(u)).map((imgUrl, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden border border-border/50 bg-background">
                <img
                  src={imgUrl}
                  alt={`Image ${idx + 1}`}
                  className="w-full max-h-[300px] object-contain bg-black/20"
                  onError={() => setFailedImages(prev => new Set(prev).add(imgUrl))}
                />
                <div className="flex items-center gap-2 px-3 py-2 border-t border-border/30 bg-surface/50">
                  <span className="text-xs font-mono text-text-muted truncate flex-1">{imgUrl}</span>
                  <button
                    onClick={() => copyUrl(imgUrl)}
                    className="p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text shrink-0"
                    title="Copy URL"
                  >
                    {copiedUrl === imgUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text shrink-0"
                    title="Open full size"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other URLs */}
      {nonImageUrls.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-text">Links ({nonImageUrls.length})</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {nonImageUrls.map((linkUrl, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border/30 hover:border-border transition-colors group">
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-blue-400 hover:text-blue-300 truncate flex-1 underline decoration-dotted underline-offset-2"
                >
                  {linkUrl}
                </a>
                <button
                  onClick={() => copyUrl(linkUrl)}
                  className="p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text opacity-0 group-hover:opacity-100 shrink-0"
                >
                  {copiedUrl === linkUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {imageUrls.length === 0 && nonImageUrls.length === 0 && (
        <div className="text-center py-12 text-text-muted/50">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No URLs detected in the response</p>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar ───────────────────────────────────────────────────── */
function Sidebar() {
  const {
    collections, savedRequests, history, searchQuery, sidebarSection,
    loadCollections, loadSavedRequests, loadHistory,
    addCollection, deleteCollection, renameCollection,
    deleteSavedRequest, openSavedRequest, openHistoryEntry, clearHistory,
    setSearchQuery, setSidebarSection,
  } = useAppStore();

  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<number>>(new Set());
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCollections();
    loadSavedRequests();
    loadHistory();
  }, []);

  const toggleCollection = (id: number) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCollection = async () => {
    if (!newCollectionName.trim()) return;
    await addCollection(newCollectionName.trim());
    setNewCollectionName('');
    setShowNewCollection(false);
  };

  const handleRename = async (id: number) => {
    if (editingName.trim()) await renameCollection(id, editingName.trim());
    setEditingCollectionId(null);
  };

  const filteredHistory = history.filter(
    (h) => !searchQuery || h.url.toLowerCase().includes(searchQuery.toLowerCase()) || h.method.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRequests = savedRequests.filter(
    (r) => !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 flex flex-col border-r border-border bg-surface/50 backdrop-blur-md shrink-0">
      {/* Brand */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <img src="/restless-logo.png" alt="RESTless" className="w-7 h-7 rounded-lg shadow-lg shadow-primary/20" />
          <h1 className="font-semibold text-sm tracking-wide">RESTless</h1>
        </div>
        <span className="text-[10px] text-text-muted/60 font-mono">v0.1</span>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-2 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background hover:bg-surface-hover transition-colors border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Section Switcher */}
      <div className="flex px-3 pt-2 gap-1">
        <button
          onClick={() => setSidebarSection('collections')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            sidebarSection === 'collections' ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text hover:bg-surface'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Collections
        </button>
        <button
          onClick={() => setSidebarSection('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            sidebarSection === 'history' ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text hover:bg-surface'
          }`}
        >
          <History className="w-3.5 h-3.5" /> History
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {sidebarSection === 'collections' ? (
          <>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] uppercase tracking-wider text-text-muted/60 font-medium">Collections</span>
              <button
                onClick={() => { setShowNewCollection(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="p-1 hover:bg-surface rounded-md transition-colors text-text-muted hover:text-text"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {showNewCollection && (
              <div className="mb-2 px-1">
                <input
                  ref={inputRef}
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCollection(); if (e.key === 'Escape') setShowNewCollection(false); }}
                  onBlur={() => { if (!newCollectionName.trim()) setShowNewCollection(false); }}
                  placeholder="Collection name..."
                  className="w-full bg-background border border-primary/50 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
            )}

            {collections.length === 0 && !showNewCollection && (
              <div className="text-center py-8 text-text-muted/50 text-xs">
                <Folder className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No collections yet</p>
                <p className="mt-1">Click + to create one</p>
              </div>
            )}

            {collections.map((col) => {
              const isExpanded = expandedCollections.has(col.id!);
              const colRequests = filteredRequests.filter((r) => r.collectionId === col.id);
              return (
                <div key={col.id} className="mb-0.5">
                  <div className="group flex items-center gap-1 px-1 py-1 hover:bg-surface rounded-md transition-colors cursor-pointer">
                    <button onClick={() => toggleCollection(col.id!)} className="p-0.5 shrink-0">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
                    </button>
                    {isExpanded ? <FolderOpen className="w-4 h-4 text-primary shrink-0" /> : <Folder className="w-4 h-4 text-text-muted shrink-0" />}
                    {editingCollectionId === col.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(col.id!); if (e.key === 'Escape') setEditingCollectionId(null); }}
                        onBlur={() => handleRename(col.id!)}
                        autoFocus
                        className="flex-1 bg-background border border-primary/50 rounded px-1.5 py-0.5 text-sm focus:outline-none"
                      />
                    ) : (
                      <span
                        className="flex-1 text-sm truncate"
                        onDoubleClick={() => { setEditingCollectionId(col.id!); setEditingName(col.name); }}
                        onClick={() => toggleCollection(col.id!)}
                      >
                        {col.name}
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted/50 mr-1">{colRequests.length}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCollection(col.id!); }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger/10 rounded transition-all text-text-muted"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="ml-5 border-l border-border/50 pl-2 space-y-0.5">
                      {colRequests.map((req) => (
                        <div
                          key={req.id}
                          className="group flex items-center gap-2 px-2 py-1 text-sm text-text-muted hover:text-text hover:bg-surface rounded-md cursor-pointer transition-colors"
                          onClick={() => openSavedRequest(req)}
                        >
                          <span className={`text-[10px] font-mono font-bold w-10 text-left shrink-0 ${METHOD_COLORS[req.method] || ''}`}>{req.method}</span>
                          <span className="truncate flex-1 text-left">{req.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSavedRequest(req.id!); }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-danger transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {colRequests.length === 0 && <p className="text-xs text-text-muted/40 px-2 py-1 italic">Empty</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] uppercase tracking-wider text-text-muted/60 font-medium">History</span>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] text-text-muted hover:text-danger transition-colors">
                  Clear
                </button>
              )}
            </div>
            {filteredHistory.length === 0 && (
              <div className="text-center py-8 text-text-muted/50 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No history yet</p>
                <p className="mt-1">Send a request to get started</p>
              </div>
            )}
            {filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="group flex items-center gap-2 px-2 py-1.5 text-sm text-text-muted hover:text-text hover:bg-surface rounded-md cursor-pointer transition-colors"
                onClick={() => openHistoryEntry(entry)}
              >
                <span className={`text-[10px] font-mono font-bold w-10 text-left shrink-0 ${METHOD_COLORS[entry.method] || ''}`}>{entry.method}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-left text-xs">{new URL(entry.url.startsWith('http') ? entry.url : `http://${entry.url}`).pathname}</p>
                </div>
                <span className={`text-[10px] font-mono shrink-0 ${entry.statusCode >= 200 && entry.statusCode < 300 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {entry.statusCode || 'ERR'}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

/* ── Save Modal ────────────────────────────────────────────────── */
function SaveModal({ onClose }: { onClose: () => void }) {
  const { collections, addCollection, saveRequest } = useAppStore();
  const [selectedCollection, setSelectedCollection] = useState<number | null>(collections[0]?.id ?? null);
  const [newName, setNewName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(collections.length === 0);

  const handleSave = async () => {
    let colId = selectedCollection;
    if (isCreatingNew && newName.trim()) {
      await addCollection(newName.trim());
      const updatedCollections = useAppStore.getState().collections;
      colId = updatedCollections[0]?.id ?? null;
    }
    if (colId != null) {
      await saveRequest(colId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl p-6 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Save Request</h2>

        {!isCreatingNew && collections.length > 0 ? (
          <>
            <label className="text-xs text-text-muted mb-1 block">Select Collection</label>
            <select
              value={selectedCollection ?? ''}
              onChange={(e) => setSelectedCollection(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-primary/50"
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={() => setIsCreatingNew(true)}
              className="text-xs text-primary hover:underline mb-4 block"
            >
              + Create new collection
            </button>
          </>
        ) : (
          <>
            <label className="text-xs text-text-muted mb-1 block">New Collection Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="My Collection"
              autoFocus
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            {collections.length > 0 && (
              <button onClick={() => setIsCreatingNew(false)} className="text-xs text-primary hover:underline mb-4 block">
                Use existing collection
              </button>
            )}
          </>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-surface-hover transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors shadow-lg shadow-primary/20"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────────────── */
function App() {
  const {
    tabs, activeTabId, addTab, closeTab, setActiveTab, updateTab,
    requestPanelTab, setRequestPanelTab,
    responsePanelTab, setResponsePanelTab,
    sendRequest,
  } = useAppStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab) return null;

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* Tab Bar */}
        <div className="h-11 flex items-end px-1 border-b border-border bg-surface/30 gap-0.5 overflow-x-auto shrink-0">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-t-lg cursor-pointer transition-colors relative max-w-[220px] ${
                tab.id === activeTabId
                  ? 'bg-surface border border-b-0 border-border'
                  : 'text-text-muted hover:bg-surface/50 border border-transparent'
              }`}
            >
              {tab.id === activeTabId && <div className="absolute top-0 left-0 w-full h-0.5 bg-primary rounded-t-lg" />}
              <span className={`text-[10px] font-mono font-bold shrink-0 ${METHOD_COLORS[tab.method] || ''}`}>{tab.method}</span>
              <span className="text-xs truncate">{tab.name || tab.url || 'New Request'}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  className="p-0.5 rounded hover:bg-surface-hover text-text-muted hover:text-text opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="h-8 px-2.5 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface/50 rounded-t-lg transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col p-4 overflow-hidden gap-4">
          {/* URL Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-surface border border-border rounded-lg overflow-hidden flex-1 shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <select
                value={activeTab.method}
                onChange={(e) => updateTab(activeTab.id, { method: e.target.value })}
                className={`bg-transparent text-sm font-mono font-bold pl-3 pr-8 py-2.5 focus:outline-none appearance-none border-r border-border cursor-pointer hover:bg-surface-hover transition-colors ${METHOD_COLORS[activeTab.method] || ''}`}
              >
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((m) => (
                  <option key={m} value={m} className="text-background">{m}</option>
                ))}
              </select>
              <input
                type="text"
                value={activeTab.url}
                onChange={(e) => updateTab(activeTab.id, { url: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none font-mono"
                placeholder="Enter request URL..."
              />
            </div>
            <button
              onClick={() => setShowSaveModal(true)}
              className="p-2.5 border border-border rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
              title="Save request"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={sendRequest}
              disabled={activeTab.isLoading}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-[0.97]"
            >
              {activeTab.isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending
                </span>
              ) : (
                <>
                  Send <Play className="w-4 h-4" fill="currentColor" />
                </>
              )}
            </button>
          </div>

          {/* Panes */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
            {/* Request Pane */}
            <div className="flex-1 min-h-0 border border-border rounded-xl flex flex-col bg-surface/50 overflow-hidden shadow-sm">
              <div className="flex items-center border-b border-border bg-surface shrink-0">
                {['Params', 'Auth', 'Headers', 'Body'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRequestPanelTab(tab)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      requestPanelTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
                    }`}
                  >
                    {tab}
                    {tab === 'Params' && activeTab.queryParams.filter((p) => p.key).length > 0 && (
                      <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">{activeTab.queryParams.filter((p) => p.key).length}</span>
                    )}
                    {tab === 'Auth' && activeTab.auth.type !== 'none' && (
                      <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full uppercase">{activeTab.auth.type}</span>
                    )}
                    {tab === 'Headers' && activeTab.headers.filter((h) => h.key).length > 0 && (
                      <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">{activeTab.headers.filter((h) => h.key).length}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {requestPanelTab === 'Params' && (
                  <KeyValueEditor items={activeTab.queryParams} onChange={(items) => updateTab(activeTab.id, { queryParams: items })} />
                )}
                {requestPanelTab === 'Auth' && (
                  <AuthEditor activeTab={activeTab} />
                )}
                {requestPanelTab === 'Headers' && (
                  <KeyValueEditor items={activeTab.headers} onChange={(items) => updateTab(activeTab.id, { headers: items })} />
                )}
                {requestPanelTab === 'Body' && (
                  <textarea
                    value={activeTab.body}
                    onChange={(e) => updateTab(activeTab.id, { body: e.target.value })}
                    className="w-full h-full bg-background border border-border rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none leading-relaxed"
                    spellCheck={false}
                    placeholder={`{
  "key": "value"
}`}
                  />
                )}
              </div>
            </div>

            {/* Response Pane */}
            <div className="flex-1 min-h-0 border border-border rounded-xl flex flex-col bg-surface/50 overflow-hidden shadow-sm relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center border-b border-border bg-surface justify-between pr-4 relative z-20 shrink-0">
                <div className="flex items-center">
                  {['Body', 'Preview', 'Headers'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setResponsePanelTab(tab)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors bg-surface ${
                        responsePanelTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
                      }`}
                    >
                      {tab}
                      {tab === 'Preview' && activeTab.response && extractUrls(activeTab.response).filter(u => isImageUrl(u)).length > 0 && (
                        <span className="ml-1.5 text-[10px] bg-emerald-400/20 text-emerald-400 px-1.5 rounded-full">
                          {extractUrls(activeTab.response).filter(u => isImageUrl(u)).length}
                        </span>
                      )}
                      {tab === 'Headers' && Object.keys(activeTab.responseHeaders).length > 0 && (
                        <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">
                          {Object.keys(activeTab.responseHeaders).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {activeTab.responseStatus !== null && (
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={`flex items-center gap-1.5 font-bold ${activeTab.responseStatus >= 200 && activeTab.responseStatus < 300 ? 'text-emerald-400' : activeTab.responseStatus >= 400 ? 'text-red-400' : 'text-amber-400'}`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${activeTab.responseStatus >= 200 && activeTab.responseStatus < 300 ? 'bg-emerald-400' : activeTab.responseStatus >= 400 ? 'bg-red-400' : 'bg-amber-400'}`} />
                      {activeTab.responseStatus === 0 ? 'ERROR' : `${activeTab.responseStatus} ${STATUS_TEXT[activeTab.responseStatus] || ''}`}
                    </span>
                    <span className="text-text-muted">{activeTab.responseTime} ms</span>
                    {activeTab.responseSize !== null && (
                      <span className="text-text-muted">
                        {activeTab.responseSize >= 1024 ? `${(activeTab.responseSize / 1024).toFixed(1)} KB` : `${activeTab.responseSize} B`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto relative z-10">
                {activeTab.isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted gap-3">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm">Sending request...</span>
                  </div>
                ) : activeTab.response !== null ? (
                  responsePanelTab === 'Body' ? (
                    <ResponseBody text={activeTab.response} />
                  ) : responsePanelTab === 'Preview' ? (
                    <ResponsePreview text={activeTab.response} />
                  ) : (
                    <div className="p-4 flex flex-col gap-1">
                      {Object.entries(activeTab.responseHeaders).map(([key, value]) => (
                        <div key={key} className="flex gap-3 py-1.5 border-b border-border/30">
                          <span className="text-primary font-mono text-sm font-semibold w-2/5 break-words shrink-0">{key}</span>
                          <span className="text-text-muted font-mono text-sm flex-1 break-words">{value}</span>
                        </div>
                      ))}
                      {Object.keys(activeTab.responseHeaders).length === 0 && (
                        <span className="text-text-muted/50 text-sm italic">No response headers.</span>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-text-muted/50 select-none flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 mb-4 rounded-2xl bg-surface flex items-center justify-center border border-border/50 shadow-inner">
                      <Play className="w-6 h-6 text-primary/30" />
                    </div>
                    <p className="text-sm">Enter a URL and hit <span className="text-primary font-medium">Send</span></p>
                    <p className="text-xs mt-1 text-text-muted/30">or press Enter in the URL bar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showSaveModal && <SaveModal onClose={() => setShowSaveModal(false)} />}
    </div>
  );
}

export default App;
