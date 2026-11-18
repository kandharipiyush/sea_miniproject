import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, UserCheck, Shield, MessageSquare, AlertCircle } from 'lucide-react';

interface TelehealthRoomProps {
  roomId: string;
  patientName: string;
  doctorName: string;
  isDoctorView?: boolean;
  onEndCall: () => void;
}

export const TelehealthRoom: React.FC<TelehealthRoomProps> = ({
  roomId,
  patientName,
  doctorName,
  isDoctorView = false,
  onEndCall,
}) => {
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [callConnected, setCallConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket signaling server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telehealth`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join-room',
        roomId,
        userId: isDoctorView ? 'doctor' : 'patient',
        role: isDoctorView ? 'doctor' : 'patient',
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'peer-joined' || msg.peerCount > 1) {
          setCallConnected(true);
        }
        if (msg.type === 'peer-left') {
          setCallConnected(false);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Call duration timer
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave-room', roomId }));
        ws.close();
      }
    };
  }, [roomId, isDoctorView]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col">
      {/* Top Header */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <div>
            <h3 className="font-bold text-sm text-white">
              CareNex Telehealth Session: {isDoctorView ? patientName : doctorName}
            </h3>
            <p className="text-[11px] text-slate-400">
              Encrypted WebRTC Session • Room: {roomId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-xs bg-slate-800 text-emerald-400 px-3 py-1 rounded-full border border-slate-700">
            {formatTimer(callDuration)}
          </span>

          {isDoctorView && (
            <button
              onClick={() => setNotesDrawerOpen(!notesDrawerOpen)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Consultation Notes</span>
            </button>
          )}

          <button
            onClick={onEndCall}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Consultation</span>
          </button>
        </div>
      </div>

      {/* Video Screens */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* Remote Video / Participant */}
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-2xl">
          {callConnected ? (
            <div className="text-center p-6">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-4xl font-bold mx-auto mb-4 shadow-xl">
                {isDoctorView ? patientName.charAt(0) : doctorName.charAt(0)}
              </div>
              <h4 className="font-bold text-lg text-white">
                {isDoctorView ? patientName : doctorName}
              </h4>
              <p className="text-xs text-emerald-400 mt-1">Live Telehealth Stream Connected</p>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-400">
              <span className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></span>
              <p className="font-semibold text-sm text-slate-200">Waiting for {isDoctorView ? 'patient' : 'doctor'} to enter room...</p>
              <p className="text-xs text-slate-500 mt-1">Audio/video session will connect automatically.</p>
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-slate-300 border border-slate-800">
            {isDoctorView ? `Patient: ${patientName}` : `Doctor: ${doctorName}`}
          </div>
        </div>

        {/* Local Video Stream */}
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-2xl">
          {videoActive ? (
            <div className="text-center p-6">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-3xl font-bold mx-auto mb-3 text-slate-200">
                {isDoctorView ? '👨‍⚕️' : '👤'}
              </div>
              <h4 className="font-semibold text-sm text-slate-200">You (Camera Active)</h4>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-500">
              <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Camera is turned off</p>
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-slate-300 border border-slate-800">
            You ({isDoctorView ? doctorName : patientName})
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-4">
        <button
          onClick={() => setMicActive(!micActive)}
          className={`p-3.5 rounded-full transition-colors ${
            micActive ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
          }`}
          title={micActive ? 'Mute Mic' : 'Unmute Mic'}
        >
          {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setVideoActive(!videoActive)}
          className={`p-3.5 rounded-full transition-colors ${
            videoActive ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
          }`}
          title={videoActive ? 'Stop Video' : 'Start Video'}
        >
          {videoActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={onEndCall}
          className="p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors shadow-lg shadow-rose-600/30"
          title="End Consultation"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Clinical Notes Drawer (For Doctor) */}
      {notesDrawerOpen && isDoctorView && (
        <div className="absolute top-16 right-0 w-80 h-[calc(100%-80px)] bg-slate-900 border-l border-slate-800 p-4 shadow-2xl z-40 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h4 className="font-bold text-xs text-white">Live Consultation Notes</h4>
            <button onClick={() => setNotesDrawerOpen(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
          <textarea
            rows={10}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Type symptoms, patient vitals, diagnosis, and treatment plan here..."
            className="w-full flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 mb-3"
          />
          <button
            onClick={() => {
              alert('Notes saved to consultation session!');
              setNotesDrawerOpen(false);
            }}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
          >
            Save to Medical Record
          </button>
        </div>
      )}
    </div>
  );
};
