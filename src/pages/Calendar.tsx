import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import {
  Plus,
  X,
  Check,
  Clock,
  Calendar as CalendarIcon,
  Users,
  MessageSquare,
  Trash2,
  Edit3,
  Video,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMeetings } from '../context/MeetingContext';
import { findUserById } from '../data/users';
import { AvailabilitySlot, MeetingRequest, MeetingType } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

// ── Utilities ─────────────────────────────────────────────────────────────────

const toDateTimeLocal = (date: Date | string): string => {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  'one-on-one': 'One-on-One',
  group: 'Group',
  pitch: 'Pitch Session',
};

const MEETING_TYPE_COLORS: Record<MeetingType, string> = {
  'one-on-one': 'bg-blue-100 text-blue-700',
  group: 'bg-purple-100 text-purple-700',
  pitch: 'bg-amber-100 text-amber-700',
};

// ── Modal: Add / Edit Availability Slot ───────────────────────────────────────

interface SlotModalProps {
  initial?: Partial<AvailabilitySlot>;
  onSave: (data: Omit<AvailabilitySlot, 'id' | 'ownerId' | 'createdAt'>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const SlotModal: React.FC<SlotModalProps> = ({ initial, onSave, onDelete, onClose }) => {
  const isEdit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [start, setStart] = useState(
    initial?.start ? toDateTimeLocal(initial.start) : toDateTimeLocal(new Date())
  );
  const [end, setEnd] = useState(
    initial?.end
      ? toDateTimeLocal(initial.end)
      : toDateTimeLocal(new Date(Date.now() + 3600000))
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [meetingType, setMeetingType] = useState<MeetingType>(
    initial?.meetingType ?? 'one-on-one'
  );
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (new Date(end) <= new Date(start)) { setError('End time must be after start time'); return; }
    onSave({ title: title.trim(), start: new Date(start).toISOString(), end: new Date(end).toISOString(), description: description.trim(), meetingType });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Availability Slot' : 'Add Availability Slot'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="e.g. Available for Pitch"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => { setStart(e.target.value); setError(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => { setEnd(e.target.value); setError(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value as MeetingType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="one-on-one">One-on-One</option>
              <option value="group">Group Session</option>
              <option value="pitch">Pitch Session</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this slot for?"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            {isEdit && onDelete && (
              <Button variant="danger" size="sm" onClick={onDelete} leftIcon={<Trash2 size={14} />}>
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" leftIcon={isEdit ? <Edit3 size={14} /> : <Plus size={14} />}>
              {isEdit ? 'Update Slot' : 'Add Slot'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Modal: Accept / Decline Incoming Request ──────────────────────────────────

interface PendingRequestModalProps {
  request: MeetingRequest;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}

const PendingRequestModal: React.FC<PendingRequestModalProps> = ({
  request,
  onAccept,
  onDecline,
  onClose,
}) => {
  const requester = findUserById(request.requesterId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h2 className="text-lg font-semibold text-gray-900">Meeting Request</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {requester && (
            <div className="flex items-center gap-3">
              <img
                src={requester.avatarUrl}
                alt={requester.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">{requester.name}</p>
                <p className="text-sm text-gray-500 capitalize">{requester.role}</p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900">{request.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={14} />
              <span>
                {format(new Date(request.start), 'MMM d, yyyy')} &bull;{' '}
                {format(new Date(request.start), 'h:mm a')} –{' '}
                {format(new Date(request.end), 'h:mm a')}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare size={14} />
              Message
            </div>
            <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
              {request.message}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="danger"
              fullWidth
              onClick={onDecline}
              leftIcon={<X size={14} />}
            >
              Decline
            </Button>
            <Button
              fullWidth
              onClick={onAccept}
              leftIcon={<Check size={14} />}
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Modal: Send a Meeting Request ──────────────────────────────────────────────

interface SendRequestModalProps {
  slot: AvailabilitySlot;
  currentUserId: string;
  onSend: (message: string) => void;
  onClose: () => void;
}

const SendRequestModal: React.FC<SendRequestModalProps> = ({
  slot,
  onSend,
  onClose,
}) => {
  const owner = findUserById(slot.ownerId);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { setError('Please write a message'); return; }
    onSend(message.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Request Meeting</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {owner && (
            <div className="flex items-center gap-3">
              <img
                src={owner.avatarUrl}
                alt={owner.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="text-xs text-gray-500">Requesting meeting with</p>
                <p className="font-semibold text-gray-900">{owner.name}</p>
                <p className="text-sm text-gray-500 capitalize">{owner.role}</p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="font-medium text-gray-900 text-sm">{slot.title}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} />
              {format(new Date(slot.start), 'MMM d, yyyy')} &bull;{' '}
              {format(new Date(slot.start), 'h:mm a')} –{' '}
              {format(new Date(slot.end), 'h:mm a')}
            </div>
            {slot.description && (
              <p className="text-xs text-gray-500 mt-1">{slot.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Message *
            </label>
            {error && (
              <p className="text-xs text-red-500 mb-1">{error}</p>
            )}
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setError(''); }}
              placeholder="Introduce yourself and explain why you'd like to meet..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={onClose}>Cancel</Button>
            <Button type="submit" fullWidth leftIcon={<MessageSquare size={14} />}>
              Send Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Modal: Confirmed Meeting Details ──────────────────────────────────────────

interface ConfirmedMeetingModalProps {
  request: MeetingRequest;
  currentUserId: string;
  onClose: () => void;
}

const ConfirmedMeetingModal: React.FC<ConfirmedMeetingModalProps> = ({
  request,
  currentUserId,
  onClose,
}) => {
  const isOwner = request.ownerId === currentUserId;
  const otherPersonId = isOwner ? request.requesterId : request.ownerId;
  const otherPerson = findUserById(otherPersonId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Confirmed Meeting</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-100">
            <h3 className="font-semibold text-gray-900">{request.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={14} />
              <span>
                {format(new Date(request.start), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon size={14} />
              <span>
                {format(new Date(request.start), 'h:mm a')} –{' '}
                {format(new Date(request.end), 'h:mm a')}
              </span>
            </div>
          </div>

          {otherPerson && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                {isOwner ? 'Meeting with' : 'Hosted by'}
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={otherPerson.avatarUrl}
                  alt={otherPerson.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">{otherPerson.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{otherPerson.role}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Meeting Notes
            </p>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border">
              {request.message}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" fullWidth leftIcon={<Video size={14} />}>
              Join Video Call
            </Button>
            <Button fullWidth onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Legend ────────────────────────────────────────────────────────────────────

const Legend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-4 text-xs">
    {[
      { color: 'bg-green-500', label: 'My Available Slots' },
      { color: 'bg-amber-400', label: 'Pending Requests' },
      { color: 'bg-blue-500', label: 'Confirmed Meetings' },
      { color: 'bg-slate-400', label: "Others' Slots" },
    ].map(({ color, label }) => (
      <div key={label} className="flex items-center gap-1.5">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-gray-600">{label}</span>
      </div>
    ))}
  </div>
);

// ── Sidebar List Items ────────────────────────────────────────────────────────

interface MeetingListItemProps {
  title: string;
  start: string;
  end: string;
  person?: { name: string; avatarUrl: string };
  badge?: { label: string; variant: 'success' | 'warning' | 'primary' | 'gray' };
  onClick: () => void;
}

const MeetingListItem: React.FC<MeetingListItemProps> = ({
  title,
  start,
  end,
  person,
  badge,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors group"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
          <Clock size={11} />
          {format(new Date(start), 'MMM d')} &bull; {format(new Date(start), 'h:mm a')} –{' '}
          {format(new Date(end), 'h:mm a')}
        </p>
        {person && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <img src={person.avatarUrl} alt={person.name} className="w-4 h-4 rounded-full object-cover" />
            <span className="text-xs text-gray-500">{person.name}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {badge && <Badge variant={badge.variant} size="sm">{badge.label}</Badge>}
        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </div>
  </button>
);

// ── Main Calendar Page ────────────────────────────────────────────────────────

type ModalType =
  | { type: 'add-slot'; start?: string; end?: string }
  | { type: 'edit-slot'; slot: AvailabilitySlot }
  | { type: 'pending-request'; request: MeetingRequest }
  | { type: 'send-request'; slot: AvailabilitySlot }
  | { type: 'confirmed'; request: MeetingRequest }
  | null;

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const { slots, requests, addSlot, updateSlot, removeSlot, addRequest, acceptRequest, declineRequest } = useMeetings();
  const [modal, setModal] = useState<ModalType>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'requests' | 'slots'>('upcoming');
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);

  if (!user) return null;

  // ── Derived data ────────────────────────────────────────────────────────────

  const mySlots = useMemo(() => slots.filter((s) => s.ownerId === user.id), [slots, user.id]);

  const otherSlots = useMemo(
    () =>
      slots.filter(
        (s) =>
          s.ownerId !== user.id &&
          !requests.some(
            (r) => r.slotId === s.id && r.requesterId === user.id && r.status !== 'declined'
          )
      ),
    [slots, requests, user.id]
  );

  const pendingIncoming = useMemo(
    () => requests.filter((r) => r.ownerId === user.id && r.status === 'pending'),
    [requests, user.id]
  );

  const confirmedMeetings = useMemo(
    () =>
      requests.filter(
        (r) =>
          (r.ownerId === user.id || r.requesterId === user.id) && r.status === 'confirmed'
      ),
    [requests, user.id]
  );

  // ── Calendar events ─────────────────────────────────────────────────────────

  const calendarEvents = useMemo(() => {
    const events: object[] = [];

    // My available slots (green) – hide if there's an active pending/confirmed request on it
    mySlots
      .filter(
        (s) =>
          !requests.some(
            (r) => r.slotId === s.id && (r.status === 'pending' || r.status === 'confirmed')
          )
      )
      .forEach((s) => {
        events.push({
          id: `slot-${s.id}`,
          title: s.title,
          start: s.start,
          end: s.end,
          backgroundColor: '#22c55e',
          borderColor: '#16a34a',
          textColor: '#fff',
          extendedProps: { kind: 'my-slot', data: s },
        });
      });

    // Pending incoming requests (amber)
    pendingIncoming.forEach((r) => {
      events.push({
        id: `req-${r.id}`,
        title: r.title,
        start: r.start,
        end: r.end,
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        textColor: '#fff',
        extendedProps: { kind: 'pending-request', data: r },
      });
    });

    // Confirmed meetings (blue)
    confirmedMeetings.forEach((r) => {
      events.push({
        id: `conf-${r.id}`,
        title: r.title,
        start: r.start,
        end: r.end,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        textColor: '#fff',
        extendedProps: { kind: 'confirmed', data: r },
      });
    });

    // Other users' available slots (gray)
    otherSlots.forEach((s) => {
      const owner = findUserById(s.ownerId);
      events.push({
        id: `other-${s.id}`,
        title: owner ? `${owner.name}: ${s.title}` : s.title,
        start: s.start,
        end: s.end,
        backgroundColor: '#94a3b8',
        borderColor: '#64748b',
        textColor: '#fff',
        extendedProps: { kind: 'other-slot', data: s },
      });
    });

    return events;
  }, [mySlots, otherSlots, pendingIncoming, confirmedMeetings, requests]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleDateSelect = (selectInfo: { start: Date; end: Date }) => {
    setModal({
      type: 'add-slot',
      start: toDateTimeLocal(selectInfo.start),
      end: toDateTimeLocal(selectInfo.end),
    });
  };

  const handleEventClick = (clickInfo: { event: { id: string; extendedProps: { kind: string; data: AvailabilitySlot | MeetingRequest } } }) => {
    const { kind, data } = clickInfo.event.extendedProps;
    if (kind === 'my-slot') setModal({ type: 'edit-slot', slot: data as AvailabilitySlot });
    else if (kind === 'pending-request') setModal({ type: 'pending-request', request: data as MeetingRequest });
    else if (kind === 'confirmed') setModal({ type: 'confirmed', request: data as MeetingRequest });
    else if (kind === 'other-slot') setModal({ type: 'send-request', slot: data as AvailabilitySlot });
  };

  const handleAddSlot = (data: Omit<AvailabilitySlot, 'id' | 'ownerId' | 'createdAt'>) => {
    addSlot({ id: `slot-${uid()}`, ownerId: user.id, createdAt: new Date().toISOString(), ...data });
    setModal(null);
  };

  const handleUpdateSlot = (slotId: string, data: Omit<AvailabilitySlot, 'id' | 'ownerId' | 'createdAt'>) => {
    updateSlot(slotId, data);
    setModal(null);
  };

  const handleDeleteSlot = (slotId: string) => {
    removeSlot(slotId);
    setModal(null);
  };

  const handleSendRequest = (slot: AvailabilitySlot, message: string) => {
    addRequest({
      id: `req-${uid()}`,
      slotId: slot.id,
      requesterId: user.id,
      ownerId: slot.ownerId,
      title: `Meeting Request: ${slot.title}`,
      start: slot.start,
      end: slot.end,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    setModal(null);
  };

  const handleAccept = (requestId: string) => {
    acceptRequest(requestId);
    setModal(null);
  };

  const handleDecline = (requestId: string) => {
    declineRequest(requestId);
    setModal(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Scheduler</h1>
          <p className="text-sm text-gray-500">Manage availability, send and accept meeting requests</p>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => setModal({ type: 'add-slot' })}
        >
          Add Availability
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Confirmed Meetings', value: confirmedMeetings.length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Pending Requests', value: pendingIncoming.length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'My Open Slots', value: mySlots.length, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-lg border p-3 ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Body: sidebar + calendar */}
      <div className="flex gap-4 min-h-0">
        {/* Sidebar */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          {/* Tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 gap-1 text-xs font-medium">
            {(
              [
                { key: 'upcoming', label: 'Upcoming', count: confirmedMeetings.length },
                { key: 'requests', label: 'Requests', count: pendingIncoming.length },
                { key: 'slots', label: 'My Slots', count: mySlots.length },
              ] as const
            ).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 ${
                  activeTab === key
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                      activeTab === key ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[520px] pr-1">
            {/* Upcoming confirmed meetings */}
            {activeTab === 'upcoming' && (
              <>
                {confirmedMeetings.length === 0 ? (
                  <EmptyState icon={<CalendarIcon size={24} />} text="No confirmed meetings yet" sub="Accept incoming requests or book a slot." />
                ) : (
                  confirmedMeetings.map((r) => {
                    const isOwner = r.ownerId === user.id;
                    const other = findUserById(isOwner ? r.requesterId : r.ownerId);
                    return (
                      <MeetingListItem
                        key={r.id}
                        title={r.title}
                        start={r.start}
                        end={r.end}
                        person={other ? { name: other.name, avatarUrl: other.avatarUrl } : undefined}
                        badge={{ label: 'Confirmed', variant: 'primary' }}
                        onClick={() => setModal({ type: 'confirmed', request: r })}
                      />
                    );
                  })
                )}
              </>
            )}

            {/* Pending incoming requests */}
            {activeTab === 'requests' && (
              <>
                {pendingIncoming.length === 0 ? (
                  <EmptyState icon={<MessageSquare size={24} />} text="No pending requests" sub="When someone books your slot, it appears here." />
                ) : (
                  pendingIncoming.map((r) => {
                    const requester = findUserById(r.requesterId);
                    return (
                      <MeetingListItem
                        key={r.id}
                        title={r.title}
                        start={r.start}
                        end={r.end}
                        person={requester ? { name: requester.name, avatarUrl: requester.avatarUrl } : undefined}
                        badge={{ label: 'Pending', variant: 'warning' }}
                        onClick={() => setModal({ type: 'pending-request', request: r })}
                      />
                    );
                  })
                )}
              </>
            )}

            {/* My availability slots */}
            {activeTab === 'slots' && (
              <>
                {mySlots.length === 0 ? (
                  <EmptyState icon={<Clock size={24} />} text="No availability slots" sub='Click "Add Availability" or select a time on the calendar.' />
                ) : (
                  mySlots.map((s) => (
                    <MeetingListItem
                      key={s.id}
                      title={s.title}
                      start={s.start}
                      end={s.end}
                      badge={{ label: MEETING_TYPE_LABELS[s.meetingType], variant: 'gray' }}
                      onClick={() => setModal({ type: 'edit-slot', slot: s })}
                    />
                  ))
                )}
                <button
                  onClick={() => setModal({ type: 'add-slot' })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Plus size={14} /> Add Slot
                </button>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="text-xs font-semibold text-gray-600 mb-2">Legend</p>
            <Legend />
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            selectable
            selectMirror
            editable={false}
            events={calendarEvents}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            nowIndicator
            eventDisplay="block"
            eventBorderRadius={6}
            dayMaxEvents={3}
          />
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'add-slot' && (
        <SlotModal
          initial={
            modal.start ? { start: new Date(modal.start).toISOString(), end: new Date(modal.end!).toISOString() } : undefined
          }
          onSave={handleAddSlot}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'edit-slot' && (
        <SlotModal
          initial={modal.slot}
          onSave={(data) => handleUpdateSlot(modal.slot.id, data)}
          onDelete={() => handleDeleteSlot(modal.slot.id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'pending-request' && (
        <PendingRequestModal
          request={modal.request}
          onAccept={() => handleAccept(modal.request.id)}
          onDecline={() => handleDecline(modal.request.id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'send-request' && (
        <SendRequestModal
          slot={modal.slot}
          currentUserId={user.id}
          onSend={(msg) => handleSendRequest(modal.slot, msg)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'confirmed' && (
        <ConfirmedMeetingModal
          request={modal.request}
          currentUserId={user.id}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

// ── Empty state helper ────────────────────────────────────────────────────────

const EmptyState: React.FC<{ icon: React.ReactNode; text: string; sub: string }> = ({
  icon,
  text,
  sub,
}) => (
  <div className="flex flex-col items-center text-center py-8 px-3">
    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-700">{text}</p>
    <p className="text-xs text-gray-400 mt-1">{sub}</p>
  </div>
);

// Suppress unused import warning for MEETING_TYPE_COLORS
void MEETING_TYPE_COLORS;
void Users;

export default Calendar;
