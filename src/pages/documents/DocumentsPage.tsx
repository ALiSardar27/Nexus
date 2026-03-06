import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Share2,
  Eye,
  PenTool,
  X,
  Check,
  AlertCircle,
  FileUp,
  File,
  Image,
  Table,
  Search,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { ChamberDocument, DocStatus } from '../../types';
import { format } from 'date-fns';

// ── Helpers ───────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const STATUS_CONFIG: Record<DocStatus, { label: string; variant: BadgeVariant; color: string }> = {
  draft: { label: 'Draft', variant: 'gray', color: 'bg-gray-400' },
  'in-review': { label: 'In Review', variant: 'warning', color: 'bg-amber-400' },
  signed: { label: 'Signed', variant: 'success', color: 'bg-green-500' },
};

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText size={22} className="text-red-500" />,
  doc: <File size={22} className="text-blue-500" />,
  docx: <File size={22} className="text-blue-500" />,
  xls: <Table size={22} className="text-green-600" />,
  xlsx: <Table size={22} className="text-green-600" />,
  img: <Image size={22} className="text-purple-500" />,
  other: <FileText size={22} className="text-gray-500" />,
};

// ── Initial mock documents ────────────────────────────────────────────────────

const INITIAL_DOCS: ChamberDocument[] = [
  {
    id: 'doc-1',
    name: 'Series A Term Sheet — TechWave AI.pdf',
    fileType: 'pdf',
    sizeBytes: 2457600,
    status: 'in-review',
    ownerId: 'e1',
    sharedWith: ['i1'],
    createdAt: '2024-02-15T09:24:00Z',
    updatedAt: '2024-02-18T14:30:00Z',
  },
  {
    id: 'doc-2',
    name: 'Investment Agreement — GreenLife.docx',
    fileType: 'docx',
    sizeBytes: 1843200,
    status: 'signed',
    ownerId: 'i2',
    sharedWith: ['e2'],
    signatureDataUrl: '',
    createdAt: '2024-02-10T11:05:00Z',
    updatedAt: '2024-02-12T16:45:00Z',
  },
  {
    id: 'doc-3',
    name: 'NDA — HealthPulse & Robert Torres.pdf',
    fileType: 'pdf',
    sizeBytes: 512000,
    status: 'draft',
    ownerId: 'e3',
    sharedWith: ['i3'],
    createdAt: '2024-02-05T08:15:00Z',
    updatedAt: '2024-02-05T08:15:00Z',
  },
  {
    id: 'doc-4',
    name: 'Financial Projections Q4.xlsx',
    fileType: 'xlsx',
    sizeBytes: 3276800,
    status: 'draft',
    ownerId: 'e1',
    sharedWith: [],
    createdAt: '2024-01-28T13:22:00Z',
    updatedAt: '2024-01-30T09:10:00Z',
  },
  {
    id: 'doc-5',
    name: 'Pitch Deck 2024.pdf',
    fileType: 'pdf',
    sizeBytes: 5242880,
    status: 'in-review',
    ownerId: 'e4',
    sharedWith: ['i1', 'i2'],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-02-01T15:30:00Z',
  },
];

// ── Signature Pad component ───────────────────────────────────────────────────

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const clearPad = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current!;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <PenTool size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">E-Signature</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500">
            Draw your signature below using your mouse or touchscreen.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <canvas
              ref={canvasRef}
              width={460}
              height={180}
              className="cursor-crosshair w-full touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={clearPad} leftIcon={<RotateCcw size={14} />}>
              Clear
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} leftIcon={<Check size={14} />}>
              Apply Signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Document Preview Modal ────────────────────────────────────────────────────

interface PreviewModalProps {
  doc: ChamberDocument;
  onClose: () => void;
  onSign: () => void;
  onStatusChange: (status: DocStatus) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ doc, onClose, onSign, onStatusChange }) => {
  const cfg = STATUS_CONFIG[doc.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {FILE_ICONS[doc.fileType]}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{doc.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                <span className="text-xs text-gray-400">{formatBytes(doc.sizeBytes)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Mock preview area */}
        <div className="flex-1 overflow-auto p-5">
          <div className="border rounded-lg bg-gray-50 min-h-[320px] flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-20 h-20 rounded-xl bg-white shadow flex items-center justify-center">
              {FILE_ICONS[doc.fileType]}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">{doc.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                Document preview is simulated. In production this would render the actual file.
              </p>
            </div>

            {/* Simulated page content */}
            <div className="w-full max-w-md bg-white rounded border p-6 mt-2 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
              <div className="h-8 mt-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />

              {doc.signatureDataUrl && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Signed:</p>
                  <img src={doc.signatureDataUrl} alt="Signature" className="h-16 object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t shrink-0 flex flex-wrap items-center gap-3">
          {/* Status change buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 mr-1">Status:</span>
            {(['draft', 'in-review', 'signed'] as DocStatus[]).map((s) => {
              const c = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    doc.status === s
                      ? s === 'draft'
                        ? 'bg-gray-200 text-gray-800'
                        : s === 'in-review'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          <Button variant="outline" size="sm" leftIcon={<Download size={14} />}>
            Download
          </Button>
          {doc.status !== 'signed' && (
            <Button size="sm" leftIcon={<PenTool size={14} />} onClick={onSign}>
              Sign Document
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Upload Modal ──────────────────────────────────────────────────────────────

interface UploadModalProps {
  onUpload: (files: File[]) => void;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onUpload, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) return;
    onUpload(selectedFiles);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Upload Documents</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
          >
            <FileUp size={36} className="mx-auto text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              Drag & drop files here, or <span className="text-blue-600">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, XLS, XLSX, PNG, JPG</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Selected files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <FileText size={14} className="text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{f.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatBytes(f.size)}</span>
                  <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={onClose}>Cancel</Button>
            <Button
              fullWidth
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0}
              leftIcon={<Upload size={14} />}
            >
              Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ChamberDocument[]>(INITIAL_DOCS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'all'>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ChamberDocument | null>(null);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);

  if (!user) return null;

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = documents.filter((d) => {
    const matchesSearch =
      search === '' || d.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const counts = {
    draft: documents.filter((d) => d.status === 'draft').length,
    'in-review': documents.filter((d) => d.status === 'in-review').length,
    signed: documents.filter((d) => d.status === 'signed').length,
    total: documents.length,
  };

  const totalSize = documents.reduce((a, d) => a + d.sizeBytes, 0);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleUpload = (files: File[]) => {
    const getFileType = (name: string): ChamberDocument['fileType'] => {
      const ext = name.split('.').pop()?.toLowerCase() ?? '';
      if (['pdf'].includes(ext)) return 'pdf';
      if (['doc', 'docx'].includes(ext)) return ext as 'doc' | 'docx';
      if (['xls', 'xlsx'].includes(ext)) return ext as 'xls' | 'xlsx';
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'img';
      return 'other';
    };

    const newDocs: ChamberDocument[] = files.map((f) => ({
      id: `doc-${uid()}`,
      name: f.name,
      fileType: getFileType(f.name),
      sizeBytes: f.size,
      status: 'draft' as DocStatus,
      ownerId: user.id,
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setDocuments((prev) => [...newDocs, ...prev]);
    setShowUpload(false);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleStatusChange = (id: string, status: DocStatus) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d
      )
    );
    if (previewDoc?.id === id) setPreviewDoc((p) => (p ? { ...p, status } : null));
  };

  const handleSignature = (dataUrl: string) => {
    if (!signingDocId) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === signingDocId
          ? { ...d, signatureDataUrl: dataUrl, status: 'signed' as DocStatus, updatedAt: new Date().toISOString() }
          : d
      )
    );
    if (previewDoc?.id === signingDocId) {
      setPreviewDoc((p) => (p ? { ...p, signatureDataUrl: dataUrl, status: 'signed' } : null));
    }
    setSigningDocId(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
          <p className="text-sm text-gray-500">Upload, preview, sign, and manage deals & contracts</p>
        </div>
        <Button leftIcon={<Upload size={16} />} onClick={() => setShowUpload(true)}>
          Upload Document
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Docs', value: counts.total, bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700' },
          { label: 'Drafts', value: counts.draft, bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
          { label: 'In Review', value: counts['in-review'], bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
          { label: 'Signed', value: counts.signed, bg: 'bg-green-50 border-green-100', text: 'text-green-700' },
          { label: 'Total Size', value: formatBytes(totalSize), bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700' },
        ].map(({ label, value, bg, text }) => (
          <div key={label} className={`rounded-lg border p-3 ${bg}`}>
            <p className={`text-xl font-bold ${text}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400 shrink-0" />
          {(['all', 'draft', 'in-review', 'signed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Documents
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({filtered.length})
            </span>
          </h2>
        </CardHeader>
        <CardBody>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <AlertCircle size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No documents found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or upload a new file.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((doc) => {
                const cfg = STATUS_CONFIG[doc.status];
                return (
                  <div
                    key={doc.id}
                    className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    {/* Icon */}
                    <div className="p-2.5 bg-gray-50 border rounded-lg mr-4 shrink-0">
                      {FILE_ICONS[doc.fileType]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                        <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                        {doc.signatureDataUrl && (
                          <Badge variant="success" size="sm">
                            <PenTool size={10} className="mr-0.5" /> Signed
                          </Badge>
                        )}
                        {doc.sharedWith.length > 0 && (
                          <Badge variant="secondary" size="sm">
                            <Share2 size={10} className="mr-0.5" /> Shared
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{doc.fileType.toUpperCase()}</span>
                        <span>{formatBytes(doc.sizeBytes)}</span>
                        <span>Updated {format(new Date(doc.updatedAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="p-2" onClick={() => setPreviewDoc(doc)}>
                        <Eye size={16} />
                      </Button>
                      {doc.status !== 'signed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => {
                            setSigningDocId(doc.id);
                          }}
                        >
                          <PenTool size={16} />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="p-2">
                        <Download size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modals */}
      {showUpload && (
        <UploadModal onUpload={handleUpload} onClose={() => setShowUpload(false)} />
      )}

      {previewDoc && (
        <PreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onSign={() => {
            setSigningDocId(previewDoc.id);
          }}
          onStatusChange={(status) => handleStatusChange(previewDoc.id, status)}
        />
      )}

      {signingDocId && (
        <SignaturePad
          onSave={handleSignature}
          onClose={() => setSigningDocId(null)}
        />
      )}
    </div>
  );
};
