import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import socket from './socket';
import Home from './components/Home';
import Documentation from './components/Documentation';
import PasswordModal from './components/PasswordModal';
import './App.css';

function App() {
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastLog, setLastLog] = useState("Waiting for events...");
  const [userCount, setUserCount] = useState(0);

  // Auth State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(false);

  const location = useLocation();

  useEffect(() => {
    // ... (socket event listeners remain the same)
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

  const handleJoinRoom = (roomId, password = null) => {
    setAuthLoading(true);
    setAuthError(false);

    // Try to join
    socket.emit('join_room', { roomId, password }, (response) => {
      setAuthLoading(false);

      if (response && response.success) {
        setJoinedRoom(roomId);
        setLastLog(`Joined Room: ${roomId}`);
        // Clear auth state
        setShowPasswordModal(false);
        setPendingRoomId(null);
        // Persist password for this session if needed, or just keep it in memory
        if (password) {
          localStorage.setItem('temp_session_pass', password);
        }
      } else if (response && response.error === "Unauthorized") {
        // Trigger Modal
        setPendingRoomId(roomId);
        setShowPasswordModal(true);
        // If we tried with a password and failed, show error
        if (password) {
          setAuthError(true);
        }
      } else {
        alert("Failed to join room: " + (response?.error || 'Unknown error'));
      }
    });
  };

  const handleAuthSubmit = (password) => {
    if (pendingRoomId) {
      handleJoinRoom(pendingRoomId, password);
    }
  };

  const handleLeaveRoom = () => {
    setJoinedRoom(null);
    setVideoSrc(null);
    setVideoFile(null);
    setIsHost(false);
    setUserCount(0);
    window.location.reload();
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
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1 className="brand-logo">
              <span style={{ fontSize: '1.6rem' }}>📽️</span> ChitraKatha
            </h1>
          </Link>

          <div className="status-group">
            {/* Navigation Links */}
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              {joinedRoom ? '📺 Back to Room' : '🏠 Home'}
            </Link>

            <Link
              to="/docs"
              className={`nav-link ${location.pathname === '/docs' ? 'active' : ''}`}
            >
              📚 Guide
            </Link>


            {joinedRoom && (
              <div className="role-badge" style={{ color: isHost ? 'var(--primary)' : 'var(--text-muted)' }}>
                {isHost ? '👑 Host' : '👤 Viewer'}
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

      <main className={`${joinedRoom ? 'joined' : ''} ${location.pathname === '/docs' ? 'docs-mode' : ''}`}>
        <Routes>
          <Route path="/" element={
            <Home
              joinedRoom={joinedRoom}
              isHost={isHost}
              videoSrc={videoSrc}
              videoFile={videoFile}
              handleJoinRoom={handleJoinRoom}
              handleLeaveRoom={handleLeaveRoom}
              handleVideoSelect={handleVideoSelect}
              handleFileReceived={handleFileReceived}
            />
          } />
          <Route path="/docs" element={<Documentation />} />
        </Routes>
      </main>
      <PasswordModal
        isOpen={showPasswordModal}
        onSubmit={handleAuthSubmit}
        onCancel={() => setShowPasswordModal(false)}
        isLoading={authLoading}
        isError={authError}
      />
    </div>
  );
}

export default App;
