import React, { useState, useEffect } from 'react';
import socket from './socket';
import RoomControls from './components/RoomControls';
import VideoPlayer from './components/VideoPlayer';
import './App.css';

function App() {
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastLog, setLastLog] = useState("Waiting for events...");

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setLastLog("Socket Connected!");
    }

    function onDisconnect() {
      setIsConnected(false);
      setLastLog("Socket Disconnected");
    }

    function onSyncAction(data) {
      setLastLog(`Rx Action: ${data.action} @ ${data.time.toFixed(2)}s`);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('sync_action', onSyncAction);

    // Initial check
    setIsConnected(socket.connected);

    socket.on('is_host', (status) => {
      console.log("Am I host?", status);
      setIsHost(status);
      setLastLog(`Host Status Change: ${status ? 'Host' : 'Viewer'}`);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sync_action', onSyncAction);
      socket.off('is_host');
    };
  }, []);

  const handleJoinRoom = (roomId) => {
    socket.emit('join_room', roomId);
    setJoinedRoom(roomId);
    setLastLog(`Joined Room: ${roomId}`);
  };

  const handleVideoSelect = (src) => {
    setVideoSrc(src);
    setLastLog(`Video Loaded`);
  };

  return (
    <div className="app-container">
      <header style={{ padding: '20px', background: '#222', color: '#fff', textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>🍿 Watch Party</h1>
        <div style={{ fontSize: '0.8rem' }}>
          Status: <span style={{ color: isConnected ? '#4caf50' : '#f44336' }}>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </header>

      {/* Debug Bar */}
      <div style={{ background: '#333', color: '#0f0', padding: '5px 20px', fontSize: '12px', fontFamily: 'monospace' }}>
        DEBUG: {lastLog}
      </div>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <RoomControls
          onJoinRoom={handleJoinRoom}
          onVideoSelect={handleVideoSelect}
          joinedRoom={joinedRoom}
        />

        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <VideoPlayer
            src={videoSrc}
            roomId={joinedRoom}
            isHost={isHost}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
