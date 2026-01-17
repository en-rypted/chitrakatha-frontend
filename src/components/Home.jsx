import React from 'react';
import RoomControls from './RoomControls';
import VideoPlayer from './VideoPlayer';
import FileTransfer from './FileTransfer';

const Home = ({
    joinedRoom,
    isHost,
    videoSrc,
    videoFile,
    handleJoinRoom,
    handleLeaveRoom,
    handleVideoSelect,
    handleFileReceived
}) => {
    return (
        <div className="animate-fade-in main-content">
            {/* Minimalist Title (Only showing when Not Joined) */}
            {!joinedRoom && (
                <div style={{ marginBottom: '40px', textAlign: 'center', width: '100%' }}>
                    <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-main)' }}>ChitraKatha</h1>
                    <p style={{ color: 'var(--primary)', margin: '10px 0 0 0', fontSize: '1rem', opacity: 0.8 }}>sync local files peer-to-peer</p>
                </div>
            )}

            {/* Video Player */}
            {joinedRoom && (
                <div className="video-player-wrapper animate-fade-in">
                    <VideoPlayer
                        src={videoSrc}
                        roomId={joinedRoom}
                        isHost={isHost}
                        autoResume={true}
                    />
                </div>
            )}

            {/* Room Controls */}
            <div className={joinedRoom ? "room-controls-wrapper" : ""} style={{ width: '100%', marginTop: joinedRoom ? '0' : '0' }}>
                <RoomControls
                    onJoinRoom={handleJoinRoom}
                    onLeaveRoom={handleLeaveRoom}
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
    );
};

export default Home;
