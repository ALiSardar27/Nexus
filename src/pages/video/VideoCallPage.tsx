import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  Users,
  Clock,
  Settings,
  MessageSquare,
  MoreVertical,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMeetings } from '../../context/MeetingContext';
import { findUserById } from '../../data/users';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

type CallState = 'idle' | 'connecting' | 'in-call' | 'ended';

interface ChatMsg {
  id: string;
  sender: string;
  text: string;
  time: Date;
}

// ── Timer hook ────────────────────────────────────────────────────────────────

function useCallTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      setSeconds(0);
      interval.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (interval.current) clearInterval(interval.current);
    }
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

// ── Simulated remote video ────────────────────────────────────────────────────

const RemoteVideoPlaceholder: React.FC<{ name: string; avatarUrl: string }> = ({
  name,
  avatarUrl,
}) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
    <div className="relative">
      <img
        src={avatarUrl}
        alt={name}
        className="w-28 h-28 rounded-full object-cover ring-4 ring-white/20"
      />
      <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full ring-2 ring-gray-900" />
    </div>
    <p className="mt-4 text-white text-lg font-semibold">{name}</p>
    <div className="flex items-center gap-1.5 mt-1">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-green-300 text-sm">Connected</span>
    </div>
  </div>
);

// ── In-call chat drawer ───────────────────────────────────────────────────────

interface ChatDrawerProps {
  open: boolean;
  messages: ChatMsg[];
  onSend: (text: string) => void;
  onClose: () => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, messages, onSend, onClose }) => {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!open) return null;

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="w-80 bg-white border-l flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-gray-900 text-sm">In-call Chat</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-8">No messages yet</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.sender === 'You' ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-gray-400 mb-0.5">{m.sender}</span>
            <div
              className={`px-3 py-1.5 rounded-xl text-sm max-w-[85%] ${
                m.sender === 'You'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-gray-300 mt-0.5">
              {format(m.time, 'h:mm a')}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button size="sm" onClick={handleSend}>
          Send
        </Button>
      </div>
    </div>
  );
};

// ── Control bar button ────────────────────────────────────────────────────────

interface ControlBtnProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}

const ControlBtn: React.FC<ControlBtnProps> = ({ icon, label, active = false, danger = false, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 group`}
    title={label}
  >
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
        danger
          ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
          : active
          ? 'bg-white/20 text-white hover:bg-white/30'
          : 'bg-red-500/80 text-white hover:bg-red-600'
      }`}
    >
      {icon}
    </div>
    <span className="text-[10px] text-white/70 group-hover:text-white/90 transition-colors">
      {label}
    </span>
  </button>
);

// ── Main page ─────────────────────────────────────────────────────────────────

export const VideoCallPage: React.FC = () => {
  const { user } = useAuth();
  const { requests } = useMeetings();

  // WebRTC streams
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // UI state
  const [callState, setCallState] = useState<CallState>('idle');
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const callDuration = useCallTimer(callState === 'in-call');
  const containerRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const confirmedMeetings = requests.filter(
    (r) =>
      (r.ownerId === user.id || r.requesterId === user.id) &&
      r.status === 'confirmed'
  );

  const peer = selectedPeer
    ? findUserById(selectedPeer)
    : null;

  // ── Media helpers ───────────────────────────────────────────────────────────

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return true;
    } catch {
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioOnly;
        setVideoOn(false);
        return true;
      } catch {
        return false;
      }
    }
  };

  const stopLocalStream = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setScreenSharing(false);

    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleStartCall = async (peerId?: string) => {
    if (peerId) setSelectedPeer(peerId);
    setCallState('connecting');
    setChatMessages([]);
    const ok = await startLocalStream();
    if (!ok) {
      setCallState('idle');
      return;
    }
    setTimeout(() => setCallState('in-call'), 1500);
  };

  const handleEndCall = () => {
    stopScreenShare();
    stopLocalStream();
    setCallState('ended');
    setVideoOn(true);
    setAudioOn(true);
    setScreenSharing(false);
    setChatOpen(false);
  };

  const handleBackToLobby = () => {
    setCallState('idle');
    setSelectedPeer(null);
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoOn(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioOn(audioTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      stopScreenShare();
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = screenStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });
      setScreenSharing(true);
    } catch {
      // user cancelled
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const handleChatSend = (text: string) => {
    setChatMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, sender: 'You', text, time: new Date() },
    ]);
    if (peer) {
      setTimeout(() => {
        const replies = [
          'Sounds good!',
          'Got it, thanks.',
          "I'll share my screen in a moment.",
          'Can you repeat that?',
          'Absolutely, let me check.',
          "Great point — let's discuss further.",
        ];
        setChatMessages((prev) => [
          ...prev,
          {
            id: `m-${Date.now()}-r`,
            sender: peer.name,
            text: replies[Math.floor(Math.random() * replies.length)],
            time: new Date(),
          },
        ]);
      }, 1200 + Math.random() * 2000);
    }
  };

  const meetingId = 'NXS-' + Math.random().toString(36).slice(2, 8).toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(meetingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render: Pre-call lobby ──────────────────────────────────────────────────

  if (callState === 'idle') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Calls</h1>
          <p className="text-sm text-gray-500">
            Start a video call with your confirmed meeting contacts
          </p>
        </div>

        {/* Quick start */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Start instant call */}
          <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Video size={24} />
              </div>
              <h2 className="text-lg font-semibold">New Meeting</h2>
              <p className="text-sm text-blue-100 mt-1">
                Start an instant video call with audio, video, and screen sharing
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm">
                <span className="text-blue-200">Room ID:</span>
                <span className="font-mono font-semibold flex-1">{meetingId}</span>
                <button onClick={handleCopy} className="hover:bg-white/10 rounded p-1 transition-colors">
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <Button
                variant="outline"
                fullWidth
                className="!bg-white !text-blue-700 !border-white hover:!bg-blue-50"
                leftIcon={<Phone size={16} />}
                onClick={() => handleStartCall()}
              >
                Start Instant Call
              </Button>
            </div>
          </div>

          {/* Confirmed meetings list */}
          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-gray-400" />
                <h2 className="font-semibold text-gray-900">Confirmed Meetings</h2>
              </div>
              <Badge variant="primary" size="sm">
                {confirmedMeetings.length}
              </Badge>
            </div>

            <div className="divide-y max-h-[380px] overflow-y-auto">
              {confirmedMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Video size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    No confirmed meetings
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Accept meeting requests from the Calendar to see them here.
                  </p>
                </div>
              ) : (
                confirmedMeetings.map((meeting) => {
                  const isOwner = meeting.ownerId === user.id;
                  const otherId = isOwner ? meeting.requesterId : meeting.ownerId;
                  const other = findUserById(otherId);
                  if (!other) return null;

                  return (
                    <div
                      key={meeting.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                    >
                      <img
                        src={other.avatarUrl}
                        alt={other.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {meeting.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users size={11} />
                            {other.name}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} />
                            {format(new Date(meeting.start), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        leftIcon={<Video size={14} />}
                        onClick={() => handleStartCall(otherId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Call
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <Video size={20} className="text-blue-600" />,
              title: 'HD Video & Audio',
              desc: 'Crystal-clear video with real-time audio using WebRTC',
              bg: 'bg-blue-50',
            },
            {
              icon: <Monitor size={20} className="text-purple-600" />,
              title: 'Screen Sharing',
              desc: 'Share your screen, slides, or application window',
              bg: 'bg-purple-50',
            },
            {
              icon: <MessageSquare size={20} className="text-green-600" />,
              title: 'In-Call Chat',
              desc: 'Send text messages while on a call without interrupting',
              bg: 'bg-green-50',
            },
          ].map(({ icon, title, desc, bg }) => (
            <div key={title} className={`${bg} rounded-xl p-5 border`}>
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm mb-3">
                {icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Render: Call ended ──────────────────────────────────────────────────────

  if (callState === 'ended') {
    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <PhoneOff size={32} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Call Ended</h2>
          <p className="text-sm text-gray-500 mt-1.5">
            Duration: <span className="font-semibold text-gray-700">{callDuration}</span>
          </p>
          {peer && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <img src={peer.avatarUrl} alt={peer.name} className="w-6 h-6 rounded-full object-cover" />
              <span className="text-sm text-gray-600">{peer.name}</span>
            </div>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={handleBackToLobby}>
              Back to Lobby
            </Button>
            <Button leftIcon={<Phone size={14} />} onClick={() => handleStartCall(selectedPeer ?? undefined)}>
              Call Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Connecting / In-Call ────────────────────────────────────────────

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-5rem)] animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${callState === 'in-call' ? 'bg-green-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-sm font-medium">
              {callState === 'connecting' ? 'Connecting...' : 'In Call'}
            </span>
          </div>
          {callState === 'in-call' && (
            <span className="text-xs text-white/60 font-mono bg-white/10 px-2 py-0.5 rounded">
              {callDuration}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {peer && (
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
              <img src={peer.avatarUrl} alt={peer.name} className="w-5 h-5 rounded-full object-cover" />
              <span className="text-xs font-medium">{peer.name}</span>
            </div>
          )}
          {screenSharing && (
            <Badge variant="warning" size="sm" className="!bg-amber-500/20 !text-amber-300">
              Sharing Screen
            </Badge>
          )}
        </div>
      </div>

      {/* Video area */}
      <div className="flex flex-1 bg-gray-900 relative overflow-hidden">
        {/* Main video area */}
        <div className="flex-1 relative">
          {/* Connecting overlay */}
          {callState === 'connecting' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900">
              <div className="relative">
                {peer && (
                  <img
                    src={peer.avatarUrl}
                    alt={peer.name}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/50 animate-pulse"
                  />
                )}
                {!peer && (
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                    <Phone size={32} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-white text-lg font-semibold mt-5">
                {peer ? `Calling ${peer.name}...` : 'Starting call...'}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Remote video (simulated) */}
          {callState === 'in-call' && peer && (
            <RemoteVideoPlaceholder name={peer.name} avatarUrl={peer.avatarUrl} />
          )}
          {callState === 'in-call' && !peer && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-3">
                  <Users size={32} className="text-gray-400" />
                </div>
                <p className="text-white/60 text-sm">Waiting for participants...</p>
              </div>
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          <div className="absolute bottom-4 right-4 z-10 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 w-48 h-36 bg-gray-800">
            {videoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: screenSharing ? 'none' : 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-1.5">
                  <VideoOff size={18} className="text-gray-400" />
                </div>
                <span className="text-[11px] text-gray-400">Camera off</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 bg-black/60 rounded px-1.5 py-0.5 text-[10px] text-white font-medium">
              You {screenSharing ? '(Screen)' : ''}
            </div>
            {!audioOn && (
              <div className="absolute top-1.5 right-1.5 bg-red-600 rounded-full p-1">
                <MicOff size={10} className="text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Chat drawer */}
        <ChatDrawer
          open={chatOpen}
          messages={chatMessages}
          onSend={handleChatSend}
          onClose={() => setChatOpen(false)}
        />
      </div>

      {/* Control bar */}
      <div className="bg-gray-900 rounded-b-xl px-6 py-4">
        <div className="flex items-center justify-center gap-5">
          <ControlBtn
            icon={audioOn ? <Mic size={20} /> : <MicOff size={20} />}
            label={audioOn ? 'Mute' : 'Unmute'}
            active={audioOn}
            onClick={toggleAudio}
          />
          <ControlBtn
            icon={videoOn ? <Video size={20} /> : <VideoOff size={20} />}
            label={videoOn ? 'Stop Video' : 'Start Video'}
            active={videoOn}
            onClick={toggleVideo}
          />
          <ControlBtn
            icon={screenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            label={screenSharing ? 'Stop Share' : 'Share Screen'}
            active={!screenSharing}
            onClick={toggleScreenShare}
          />
          <ControlBtn
            icon={<MessageSquare size={20} />}
            label="Chat"
            active
            onClick={() => setChatOpen((o) => !o)}
          />
          <ControlBtn
            icon={fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            label={fullscreen ? 'Exit' : 'Fullscreen'}
            active
            onClick={toggleFullscreen}
          />

          <div className="w-px h-8 bg-white/20 mx-2" />

          <ControlBtn
            icon={<PhoneOff size={22} />}
            label="End Call"
            danger
            onClick={handleEndCall}
          />
        </div>
      </div>
    </div>
  );
};
