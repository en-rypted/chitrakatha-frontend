import React, { useState, useEffect } from 'react';
import socket from './socket';
import RoomControls from './components/RoomControls';
import VideoPlayer from './components/VideoPlayer';
import './App.css';

import FileTransfer from './components/FileTransfer';

function App() {
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFile, setVideoFile] = useState(null); // Track actual file for P2P
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastLog, setLastLog] = useState("Waiting for events...");
  const [userCount, setUserCount] = useState(0);

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

    function onRoomUsersUpdate(count) {
      console.log("Room users updated:", count);
      setUserCount(count);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('sync_action', onSyncAction);
    socket.on('room_users_update', onRoomUsersUpdate);

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
      socket.off('room_users_update', onRoomUsersUpdate);
      socket.off('is_host');
    };
  }, []);

  const handleJoinRoom = (roomId) => {
    socket.emit('join_room', roomId);
    setJoinedRoom(roomId);
    setLastLog(`Joined Room: ${roomId}`);
  };

  const handleVideoSelect = (src, type, file) => {
    setVideoSrc(src);
    if (type === 'file' && file) {
      setVideoFile(file);
    } else {
      setVideoFile(null);
    }
    setLastLog(`Video Loaded (${type})`);
  };

  const handleFileReceived = (blobUrl) => {
    setVideoSrc(blobUrl);
    setLastLog("P2P Download Complete - Playing");
  };

  return (
    <div className="app-container">
      <header>
        <div className="header-content">
          <h1 className="brand-logo">
            <span style={{ fontSize: '1.6rem' }}>📽️</span> ChitraKatha
          </h1>
          <div className="status-group">
            {joinedRoom && (
              <div className="role-badge" style={{ color: isHost ? 'var(--primary)' : 'var(--text-muted)' }}>
                {isHost ? '👑 You are the Host' : '👤 You are a Viewer'}
              </div>
            )}

            {joinedRoom && (
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', opacity: 0.8 }}>
                👥 {userCount}
              </div>
            )}

            <div className="connection-badge">
              <span style={{ color: isConnected ? '#4caf50' : '#f44336', marginRight: '6px' }}>●</span>
              {isConnected ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </header>

      {/* Debug Bar (Hidden unless errors/dev) */}
      {/* <div style={{ background: '#000', color: '#0f0', padding: '2px 20px', fontSize: '10px', fontFamily: 'monospace', borderBottom: '1px solid #333' }}>
        DEBUG: {lastLog}
      </div> */}

      <main className={joinedRoom ? 'joined' : ''}>
        <div className="animate-fade-in main-content">

          {/* Minimalist Title (Only showing when Not Joined) */}
          {!joinedRoom && (
            <div style={{ marginBottom: '40px', textAlign: 'center', width: '100%' }}>
              <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-main)' }}>ChitraKatha</h1>
              <p style={{ color: 'var(--primary)', margin: '10px 0 0 0', fontSize: '1rem', opacity: 0.8 }}>sync local files peer-to-peer</p>
            </div>
          )}

          {/* If Joined, layout is: Video (Left) -> Controls (Right) on Desktop */}

          {/* Video Player */}
          {joinedRoom && (
            <div className="video-player-wrapper animate-fade-in">
              <VideoPlayer
                src={videoSrc}
                roomId={joinedRoom}
                isHost={isHost}
                autoResume={true} // Enable seamless transitions for previews
              />
            </div>
          )}

          {/* Room Controls */}
          <div className={joinedRoom ? "room-controls-wrapper" : ""} style={{ width: '100%', marginTop: joinedRoom ? '0' : '0' }}>
            <RoomControls
              onJoinRoom={handleJoinRoom}
              onVideoSelect={handleVideoSelect}
              joinedRoom={joinedRoom}
            />

            {joinedRoom && (
              <FileTransfer
                isHost={isHost}
                roomId={joinedRoom}
                fileToShare={videoFile}
                onFileReceived={handleFileReceived}
              />
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
