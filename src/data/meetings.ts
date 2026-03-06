import { AvailabilitySlot, MeetingRequest } from '../types';

const now = new Date();

const dt = (daysOffset: number, hours: number, minutes = 0): string => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

let _slots: AvailabilitySlot[] = [
  {
    id: 'slot-1',
    ownerId: 'e1',
    title: 'Available for Pitch',
    start: dt(1, 10),
    end: dt(1, 11),
    description: 'Open slot for investor pitches about TechWave AI. Looking for Series A funding discussions.',
    meetingType: 'pitch',
    createdAt: new Date(now.getTime() - 86400000).toISOString(),
  },
  {
    id: 'slot-2',
    ownerId: 'e1',
    title: 'Q&A Session',
    start: dt(3, 14),
    end: dt(3, 15),
    description: 'Happy to answer any questions about our product roadmap and team.',
    meetingType: 'one-on-one',
    createdAt: new Date(now.getTime() - 43200000).toISOString(),
  },
  {
    id: 'slot-3',
    ownerId: 'i1',
    title: 'Investor Office Hours',
    start: dt(1, 15),
    end: dt(1, 16),
    description: 'Available to meet with promising startups in FinTech, SaaS, and AI.',
    meetingType: 'one-on-one',
    createdAt: new Date(now.getTime() - 72000000).toISOString(),
  },
  {
    id: 'slot-4',
    ownerId: 'e2',
    title: 'GreenLife Demo',
    start: dt(4, 9),
    end: dt(4, 10),
    description: 'Live demo of our CleanTech solution for investors interested in sustainability.',
    meetingType: 'pitch',
    createdAt: new Date(now.getTime() - 36000000).toISOString(),
  },
  {
    id: 'slot-5',
    ownerId: 'i2',
    title: 'Portfolio Review Slot',
    start: dt(5, 11),
    end: dt(5, 12),
    description: 'Open to reviewing potential additions to my CleanTech and AgTech portfolio.',
    meetingType: 'group',
    createdAt: new Date(now.getTime() - 21600000).toISOString(),
  },
  {
    id: 'slot-6',
    ownerId: 'e3',
    title: 'HealthPulse Investor Slot',
    start: dt(2, 13),
    end: dt(2, 14),
    description: 'Open to discuss HealthPulse growth metrics and investment opportunities.',
    meetingType: 'pitch',
    createdAt: new Date(now.getTime() - 14400000).toISOString(),
  },
];

let _requests: MeetingRequest[] = [
  {
    id: 'req-1',
    slotId: 'slot-1',
    requesterId: 'i1',
    ownerId: 'e1',
    title: 'Investment Discussion - TechWave AI',
    start: dt(1, 10),
    end: dt(1, 11),
    message:
      "Hi Sarah! I'm very interested in TechWave AI. I'd love to discuss potential investment opportunities and learn more about your Series A roadmap.",
    status: 'pending',
    createdAt: new Date(now.getTime() - 7200000).toISOString(),
  },
  {
    id: 'req-2',
    slotId: 'slot-3',
    requesterId: 'e3',
    ownerId: 'i1',
    title: 'HealthPulse Pitch Meeting',
    start: dt(1, 15),
    end: dt(1, 16),
    message:
      "Hello Michael, I'd like to present HealthPulse and explore a potential partnership. We've had 300% growth this quarter!",
    status: 'confirmed',
    createdAt: new Date(now.getTime() - 86400000).toISOString(),
  },
  {
    id: 'req-3',
    slotId: 'slot-2',
    requesterId: 'i2',
    ownerId: 'e1',
    title: 'CleanTech Synergy Discussion',
    start: dt(3, 14),
    end: dt(3, 15),
    message:
      "Sarah, I see great synergy between TechWave AI and my CleanTech portfolio. Would love to explore collaboration opportunities!",
    status: 'pending',
    createdAt: new Date(now.getTime() - 1800000).toISOString(),
  },
  {
    id: 'req-4',
    slotId: 'slot-6',
    requesterId: 'i3',
    ownerId: 'e3',
    title: 'BioTech Investment Discussion',
    start: dt(2, 13),
    end: dt(2, 14),
    message:
      "Maya, HealthPulse perfectly aligns with my BioTech investment focus. I'd love to discuss a potential Series A partnership.",
    status: 'confirmed',
    createdAt: new Date(now.getTime() - 172800000).toISOString(),
  },
];

// ── Read helpers ──────────────────────────────────────────────────────────────

export const getSlots = (): AvailabilitySlot[] => [..._slots];
export const getRequests = (): MeetingRequest[] => [..._requests];

export const getSlotsForUser = (userId: string): AvailabilitySlot[] =>
  _slots.filter((s) => s.ownerId === userId);

export const getOtherUsersSlots = (userId: string): AvailabilitySlot[] =>
  _slots.filter((s) => s.ownerId !== userId);

export const getIncomingPendingRequests = (userId: string): MeetingRequest[] =>
  _requests.filter((r) => r.ownerId === userId && r.status === 'pending');

export const getConfirmedMeetings = (userId: string): MeetingRequest[] =>
  _requests.filter(
    (r) =>
      (r.ownerId === userId || r.requesterId === userId) &&
      r.status === 'confirmed'
  );

export const getAllMeetingsForUser = (userId: string): MeetingRequest[] =>
  _requests.filter((r) => r.ownerId === userId || r.requesterId === userId);

// ── Write helpers ─────────────────────────────────────────────────────────────

export const addSlot = (slot: AvailabilitySlot): void => {
  _slots = [..._slots, slot];
};

export const updateSlot = (id: string, updates: Partial<AvailabilitySlot>): void => {
  _slots = _slots.map((s) => (s.id === id ? { ...s, ...updates } : s));
};

export const removeSlot = (id: string): void => {
  _slots = _slots.filter((s) => s.id !== id);
};

export const addRequest = (req: MeetingRequest): void => {
  _requests = [..._requests, req];
};

export const setRequestStatus = (
  id: string,
  status: MeetingRequest['status']
): void => {
  _requests = _requests.map((r) => (r.id === id ? { ...r, status } : r));
};
