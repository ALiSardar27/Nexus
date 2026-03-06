import React, { createContext, useContext, useState, useCallback } from 'react';
import { AvailabilitySlot, MeetingRequest } from '../types';
import * as meetingsData from '../data/meetings';

interface MeetingContextValue {
  slots: AvailabilitySlot[];
  requests: MeetingRequest[];
  addSlot: (slot: AvailabilitySlot) => void;
  updateSlot: (id: string, updates: Partial<AvailabilitySlot>) => void;
  removeSlot: (id: string) => void;
  addRequest: (req: MeetingRequest) => void;
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() =>
    meetingsData.getSlots()
  );
  const [requests, setRequests] = useState<MeetingRequest[]>(() =>
    meetingsData.getRequests()
  );

  const addSlot = useCallback((slot: AvailabilitySlot) => {
    meetingsData.addSlot(slot);
    setSlots(meetingsData.getSlots());
  }, []);

  const updateSlot = useCallback(
    (id: string, updates: Partial<AvailabilitySlot>) => {
      meetingsData.updateSlot(id, updates);
      setSlots(meetingsData.getSlots());
    },
    []
  );

  const removeSlot = useCallback((id: string) => {
    meetingsData.removeSlot(id);
    setSlots(meetingsData.getSlots());
  }, []);

  const addRequest = useCallback((req: MeetingRequest) => {
    meetingsData.addRequest(req);
    setRequests(meetingsData.getRequests());
  }, []);

  const acceptRequest = useCallback((id: string) => {
    meetingsData.setRequestStatus(id, 'confirmed');
    setRequests(meetingsData.getRequests());
  }, []);

  const declineRequest = useCallback((id: string) => {
    meetingsData.setRequestStatus(id, 'declined');
    setRequests(meetingsData.getRequests());
  }, []);

  return (
    <MeetingContext.Provider
      value={{
        slots,
        requests,
        addSlot,
        updateSlot,
        removeSlot,
        addRequest,
        acceptRequest,
        declineRequest,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeetings = (): MeetingContextValue => {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error('useMeetings must be used inside <MeetingProvider>');
  return ctx;
};
