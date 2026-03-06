import React, { createContext, useContext, useState, useCallback } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface TourContextValue {
  startTour: (steps: Step[]) => void;
  endTour: () => void;
  hasSeenTour: (key: string) => boolean;
  markTourSeen: (key: string) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

const STORAGE_PREFIX = 'nexus_tour_';

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const startTour = useCallback((newSteps: Step[]) => {
    setSteps(newSteps);
    setRun(true);
  }, []);

  const endTour = useCallback(() => {
    setRun(false);
    setSteps([]);
  }, []);

  const hasSeenTour = useCallback((key: string) => {
    return localStorage.getItem(STORAGE_PREFIX + key) === 'true';
  }, []);

  const markTourSeen = useCallback((key: string) => {
    localStorage.setItem(STORAGE_PREFIX + key, 'true');
  }, []);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
    }
  };

  return (
    <TourContext.Provider value={{ startTour, endTour, hasSeenTour, markTourSeen }}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        callback={handleCallback}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: '#2563eb',
            textColor: '#1f2937',
            backgroundColor: '#ffffff',
            arrowColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.45)',
          },
          tooltip: {
            borderRadius: '12px',
            padding: '20px',
            fontSize: '14px',
          },
          tooltipTitle: {
            fontSize: '16px',
            fontWeight: 700,
          },
          tooltipContent: {
            fontSize: '13px',
            lineHeight: '1.6',
            padding: '10px 0',
          },
          buttonNext: {
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            fontWeight: 600,
          },
          buttonBack: {
            marginRight: 8,
            color: '#6b7280',
            fontSize: '13px',
          },
          buttonSkip: {
            color: '#9ca3af',
            fontSize: '12px',
          },
          spotlight: {
            borderRadius: '12px',
          },
        }}
        locale={{
          back: 'Back',
          close: 'Got it',
          last: 'Finish Tour',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextValue => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside <TourProvider>');
  return ctx;
};
