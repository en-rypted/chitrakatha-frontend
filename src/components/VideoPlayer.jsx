import React, { useRef, useEffect } from 'react';
import socket from '../socket';

// Flag to prevent infinite loops when programmatic update triggers event listeners
let isRemoteUpdate = false;

const VideoPlayer = ({ src, roomId, isHost }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        // Only run this effect if we have a video element AND we are in a room
        if (!videoRef.current || !roomId) return;

        const video = videoRef.current;
        console.log(`VideoPlayer: Attached listeners for Room ${roomId}`);

        // --- Socket Event Listeners ---
        const handleSyncAction = (data) => {
            console.log('VideoPlayer: Received sync_action:', data);
            if (data.roomId !== roomId) return;

            isRemoteUpdate = true; // Set flag before modifying video

            const timeDiff = Math.abs(video.currentTime - data.time);

            if (data.action === 'PLAY') {
                // Only seek if drifted significantly to avoid jumping
                if (timeDiff > 0.5) video.currentTime = data.time;
                video.play().catch(e => console.error("Auto-play blocked:", e));
            } else if (data.action === 'PAUSE') {
                if (timeDiff > 0.5) video.currentTime = data.time;
                video.pause();
            } else if (data.action === 'SEEK') {
                video.currentTime = data.time;
            }

            // Short timeout to reset flag
            setTimeout(() => {
                isRemoteUpdate = false;
            }, 500); // 100ms might be too short for some async player events? increasing to 500
        };

        const handleSyncTime = (data) => {
            if (data.roomId !== roomId) return;
            // Drift correction for clients
            const timeDiff = Math.abs(video.currentTime - data.time);
            if (timeDiff > 1.0) { // Increased threshold to 1.0s to be less aggressive
                console.log(`Drift correction: seeking ${video.currentTime} -> ${data.time}`);
                isRemoteUpdate = true;
                video.currentTime = data.time;
                setTimeout(() => { isRemoteUpdate = false; }, 500);
            }
        };

        socket.on('sync_action', handleSyncAction);
        socket.on('sync_time', handleSyncTime);

        return () => {
            console.log(`VideoPlayer: Detaching listeners for Room ${roomId}`);
            socket.off('sync_action', handleSyncAction);
            socket.off('sync_time', handleSyncTime);
        };
    }, [roomId, src]); // Added src to dependencies

    const emitAction = (action) => {
        if (isRemoteUpdate) return;
        if (!roomId) return;

        const video = videoRef.current;
        socket.emit('sync_action', {
            roomId,
            action,
            time: video.currentTime
        });
    };

    const handlePlay = () => emitAction('PLAY');
    const handlePause = () => emitAction('PAUSE');
    const handleSeeked = () => emitAction('SEEK');

    // --- Drift Correction (Host side) ---
    useEffect(() => {
        let interval;
        if (isHost && roomId) {
            interval = setInterval(() => {
                if (videoRef.current && !videoRef.current.paused) {
                    socket.emit('sync_time', {
                        roomId,
                        time: videoRef.current.currentTime
                    });
                }
            }, 5000); // Every 5 seconds
        }
        return () => clearInterval(interval);
    }, [isHost, roomId]);

    return (
        <div className="video-player-container">
            {src ? (
                <video
                    ref={videoRef}
                    src={src}
                    controls
                    width="100%"
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSeeked={handleSeeked}
                    style={{ maxHeight: '80vh', backgroundColor: '#000' }}
                />
            ) : (
                <div style={{ padding: '20px', textAlign: 'center', background: '#eee' }}>
                    No video loaded. Select a file or URL above.
                </div>
            )}
            {isHost && <div style={{ color: 'green', marginTop: '5px', fontWeight: 'bold' }}>👑 You are the Host</div>}
        </div>
    );
};

export default VideoPlayer;
