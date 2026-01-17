import React, { useState } from 'react';

const RoomControls = ({ onJoinRoom, onVideoSelect, joinedRoom }) => {
    const [roomId, setRoomId] = useState('');
    const [videoUrl, setVideoUrl] = useState('');

    const handleJoin = () => {
        if (roomId.trim()) {
            onJoinRoom(roomId);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onVideoSelect(url, 'file');
        }
    };

    const handleUrlSubmit = () => {
        if (videoUrl.trim()) {
            onVideoSelect(videoUrl, 'url');
        }
    };

    return (
        <div className="room-controls" style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
            {!joinedRoom ? (
                <div className="section">
                    <h3>Join Room</h3>
                    <input
                        type="text"
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        style={{ padding: '8px', marginRight: '10px' }}
                    />
                    <button onClick={handleJoin} style={{ padding: '8px' }}>Join/Create</button>
                </div>
            ) : (
                <div className="section">
                    <h3>Room: {joinedRoom}</h3>
                </div>
            )}

            <div className="section" style={{ marginTop: '20px' }}>
                <h3>Video Source</h3>
                <div className="video-input" style={{ marginBottom: '10px' }}>
                    <label style={{ marginRight: '10px' }}>Local File:</label>
                    <input type="file" accept="video/*" onChange={handleFileChange} />
                </div>
                <div className="video-input">
                    <label style={{ marginRight: '10px' }}>OR Video URL:</label>
                    <input
                        type="text"
                        placeholder="http://..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        style={{ padding: '8px', width: '300px', marginRight: '10px' }}
                    />
                    <button onClick={handleUrlSubmit} style={{ padding: '8px' }}>Load URL</button>
                </div>
            </div>
        </div>
    );
};

export default RoomControls;
