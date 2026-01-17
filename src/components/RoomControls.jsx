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
            onVideoSelect(url, 'file', file); // Pass file object
        }
    };

    const handleUrlSubmit = () => {
        if (videoUrl.trim()) {
            onVideoSelect(videoUrl, 'url');
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            {!joinedRoom ? (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="enter room name..."
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <button className="primary-btn" onClick={handleJoin}>join / create</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
                        room: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{joinedRoom}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
                        <div style={{ width: '100%' }}>
                            <input type="file" accept="video/*" onChange={handleFileChange} style={{ width: '100%' }} />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '5px' }}>click to select local file</p>
                        </div>

                        <div style={{ width: '100%', borderTop: '1px solid var(--text-muted)', opacity: 0.3 }}></div>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                            <input
                                type="text"
                                placeholder="or paste url..."
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                style={{ fontSize: '1rem', width: '100%' }}
                            />
                            <button onClick={handleUrlSubmit} style={{ marginTop: '10px', alignSelf: 'center' }}>load url</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomControls;
