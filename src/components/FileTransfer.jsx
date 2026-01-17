import React, { useState, useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';
import socket from '../socket';
import LocalTransfer from './LocalTransfer';


const STUN_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.l.google.com:5349" },
        { urls: "stun:stun1.l.google.com:3478" },
        { urls: "stun:stun1.l.google.com:5349" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:5349" },
        { urls: "stun:stun3.l.google.com:3478" },
        { urls: "stun:stun3.l.google.com:5349" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:5349" }
    ]
};

const WebRTCTransfer = ({ isHost, roomId, onFileReceived, fileToShare }) => {
    // For Host:
    const [peers, setPeers] = useState({}); // { socketId: peerInstance }

    // For Client:
    const [fileMeta, setFileMeta] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadSpeed, setDownloadSpeed] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    // Speed calculation ref
    const speedRef = useRef({
        lastTime: Date.now(),
        bytesReceived: 0
    });

    // UI Throttling
    const lastUIUpdateRef = useRef(0);

    // Both:
    const chunksRef = useRef([]);

    useEffect(() => {
        const announceFile = () => {
            if (isHost && fileToShare) {
                console.log("Announcing file to room...");
                socket.emit('host_file_meta', {
                    roomId,
                    meta: {
                        name: fileToShare.name,
                        size: fileToShare.size,
                        type: fileToShare.type
                    }
                });
            }
        };

        // HOST LOGIC: When a file is selected, announce it
        announceFile();

        // Also announce when a new user joins
        const handleUserJoined = (userId) => {
            console.log(`User ${userId} joined, re-announcing file.`);
            announceFile();
        };

        socket.on('user_joined', handleUserJoined);
        return () => socket.off('user_joined', handleUserJoined);

    }, [isHost, fileToShare, roomId]);

    useEffect(() => {
        // CLIENT LOGIC: Listen for file announcements
        const handleHostFileMeta = (meta) => {
            console.log("Host announced file:", meta);
            setFileMeta(meta);
        };

        // SHARED LOGIC: Handle Signaling
        const handleP2PSignal = (data) => {
            const { from, signal } = data;

            if (isHost) {
                console.log(`Host received signal from ${from}`);
                // Host receives "Offer" from Client
                if (!peers[from]) {
                    const peer = new SimplePeer({
                        initiator: false,
                        trickle: true,
                        config: STUN_CONFIG
                    });

                    peer.on('signal', (signal) => {
                        console.log(`Host sending Answer to ${from}`);
                        socket.emit('p2p_signal', { to: from, signal });
                    });

                    peer.on('connect', () => {
                        console.log(`[Host] Connected to peer ${from}. sending file...`);
                        peer.send('START'); // Wake up signal
                        sendFile(peer, fileToShare);
                    });

                    peer.signal(signal);
                    setPeers(prev => ({ ...prev, [from]: peer }));
                } else {
                    peers[from].signal(signal);
                }
            }
        };

        socket.on('host_file_meta', handleHostFileMeta);
        if (isHost) {
            socket.on('p2p_signal', handleP2PSignal);
        }

        return () => {
            socket.off('host_file_meta', handleHostFileMeta);
            socket.off('p2p_signal', handleP2PSignal);
        };
    }, [roomId, isHost, fileToShare, peers]);

    // -- Client Side Peer Ref --
    const clientPeerRef = useRef(null);

    useEffect(() => {
        const handleSignal = (data) => {
            const { from, signal } = data;
            // Client receives Answer from Host
            if (!isHost && clientPeerRef.current) {
                console.log("Client received Answer from Host");
                clientPeerRef.current.signal(signal);
            }
        };
        socket.on('p2p_signal', handleSignal);
        return () => socket.off('p2p_signal', handleSignal);
    }, [isHost]);


    const sendFile = (peer, file) => {
        if (!file) {
            console.error("[Sender] Error: No file to share!");
            return;
        }
        console.log(`[Sender] Starting transfer of ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        const CHUNK_SIZE = 256 * 1024; // 256KB
        const MAX_BUFFERED_AMOUNT = 8 * 1024 * 1024; // 8MB buffer limit
        let offset = 0;
        let lastLoggedPercent = 0;

        const reader = new FileReader();

        const readNextChunk = () => {
            if (peer.destroyed) return;

            if (peer._channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
                setTimeout(readNextChunk, 50);
                return;
            }

            const slice = file.slice(offset, offset + CHUNK_SIZE);
            reader.readAsArrayBuffer(slice);
        };

        reader.onload = (e) => {
            if (peer.destroyed) return;
            const chunk = e.target.result;

            try {
                peer.send(chunk);
                offset += chunk.byteLength;

                const percent = Math.floor((offset / file.size) * 100);
                if (percent >= lastLoggedPercent + 10) {
                    console.log(`[Sender] Progress: ${percent}%`);
                    lastLoggedPercent = percent;
                }

                if (offset < file.size) {
                    readNextChunk();
                } else {
                    peer.send('Done');
                    console.log("[Sender] File sent completely");
                }
            } catch (err) {
                console.error("[Sender] Send error:", err);
            }
        };

        // Initialize connection
        peer.send('START');
        readNextChunk();
    };

    const startDownload = () => {
        if (!fileMeta) return;
        setIsDownloading(true);
        chunksRef.current = [];

        speedRef.current = { lastTime: Date.now(), bytesReceived: 0 };

        console.log("[Receiver] Starting download from Host:", fileMeta.hostId);
        const peer = new SimplePeer({
            initiator: true,
            trickle: true,
            config: STUN_CONFIG
        });
        clientPeerRef.current = peer;

        peer.on('signal', (signal) => {
            console.log("[Receiver] Sending Offer...");
            socket.emit('p2p_signal', { to: fileMeta.hostId, signal });
        });

        // Add explicit connect listener
        peer.on('connect', () => {
            console.log("[Receiver] Peer Connected! Waiting for data...");
        });

        peer.on('error', (err) => {
            console.error("[Receiver] Peer Error:", err);
            setIsDownloading(false);
            alert("Connection Failed: " + err.message);
        });

        peer.on('close', () => {
            console.log("[Receiver] Peer Closed");
            if (downloadProgress < 100) {
                console.warn("[Receiver] Connection closed incomplete");
            }
        });

        peer.on('data', (data) => {
            let text = '';
            try {
                text = new TextDecoder().decode(data);
            } catch (e) { }

            if (text === 'Done') {
                console.log("[Receiver] Download complete!");
                const blob = new Blob(chunksRef.current, { type: fileMeta.type });
                const url = URL.createObjectURL(blob);
                onFileReceived(url);
                setIsDownloading(false);
                peer.destroy();
            } else if (text === 'START') {
                console.log("[Receiver] Host signaled START.");
            } else {
                chunksRef.current.push(data);

                // Speed Calculation
                const now = Date.now();
                speedRef.current.bytesReceived += data.byteLength;
                const timeDiff = now - speedRef.current.lastTime;

                if (timeDiff >= 1000) {
                    const speedBytes = (speedRef.current.bytesReceived / timeDiff) * 1000;
                    const speedMB = (speedBytes / (1024 * 1024)).toFixed(2);
                    setDownloadSpeed(`${speedMB} MB/s`);

                    speedRef.current.lastTime = now;
                    speedRef.current.bytesReceived = 0;
                }

                // Calculate progress
                const received = chunksRef.current.reduce((acc, chunk) => acc + chunk.byteLength, 0);
                const total = fileMeta.size || 1;
                const percent = Math.round((received / total) * 100);

                if (now - lastUIUpdateRef.current > 200) {
                    setDownloadProgress(percent);
                    lastUIUpdateRef.current = now;
                }
            }
        });
    };

    const handlePreview = () => {
        if (chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: fileMeta.type || 'video/mp4' });
        const url = URL.createObjectURL(blob);
        onFileReceived(url);
    };

    return (
        <div className="animate-fade-in">
            {!isHost && fileMeta && !isDownloading && (
                <div className="animate-fade-in">
                    <p style={{ fontSize: '1rem', margin: '10px 0' }}>
                        Host is sharing <span style={{ color: 'var(--text-main)' }}>{fileMeta.name}</span>
                        <span style={{ opacity: 0.6, fontSize: '0.8rem', marginLeft: '10px' }}>
                            ({(fileMeta.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                    </p>
                    <button onClick={startDownload} className="primary-btn">
                        download & play
                    </button>
                </div>
            )}

            {isDownloading && (
                <div className="animate-fade-in">
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                        downloading {downloadProgress}%
                        {downloadSpeed && <span style={{ opacity: 0.6, fontSize: '0.8rem', marginLeft: '10px' }}>({downloadSpeed})</span>}
                    </p>
                    <div style={{
                        width: '100%',
                        height: '2px',
                        background: 'var(--text-muted)',
                        marginTop: '5px',
                        marginBottom: '15px'
                    }}>
                        <div style={{
                            width: `${downloadProgress}%`,
                            height: '100%',
                            background: 'var(--primary)',
                            transition: 'width 0.2s linear'
                        }}></div>
                    </div>

                    {downloadProgress > 10 && (
                        <button
                            onClick={handlePreview}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--primary)',
                                color: 'var(--primary)',
                                fontSize: '0.8rem',
                                padding: '5px 10px',
                                cursor: 'pointer',
                                opacity: 0.8
                            }}
                            title="Play what has been downloaded so far"
                        >
                            ▶ update preview
                        </button>
                    )}
                </div>
            )}

            {!isDownloading && downloadProgress === 100 && (
                <div className="animate-fade-in" style={{ marginBottom: '20px' }}>
                    <p style={{ color: '#4caf50', margin: '0 0 10px 0', fontSize: '0.9rem' }}>✓ download complete</p>
                    <button
                        onClick={() => {
                            if (chunksRef.current.length === 0) return;
                            const blob = new Blob(chunksRef.current, { type: fileMeta?.type || 'video/mp4' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = fileMeta?.name || 'downloaded_video.mp4';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }}
                        style={{
                            background: 'var(--primary)',
                            border: 'none',
                            color: '#000',
                            fontWeight: 'bold',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        💾 save to disk
                    </button>
                </div>
            )}

            {isHost && fileToShare && (
                <div className="animate-fade-in" style={{ fontSize: '0.8rem', color: 'var(--primary)', opacity: 0.8 }}>
                    ● sharing active: {fileToShare.name}
                </div>
            )}
        </div>
    );
};

const FileTransfer = (props) => {
    const [mode, setMode] = useState('webrtc'); // 'webrtc' | 'agent' | 'docs'

    return (
        <div className="file-transfer-card" style={{
            marginTop: '20px',
            background: 'var(--glass)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid var(--glass-border)',
            textAlign: 'center'
        }}>

            {/* Mode Toggle */}
            <div className="transfer-mode-toggle" style={{
                display: 'inline-flex',
                gap: '8px',
                background: 'rgba(0,0,0,0.3)',
                padding: '4px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <button
                    onClick={() => setMode('webrtc')}
                    style={{
                        background: mode === 'webrtc' ? 'var(--primary)' : 'transparent',
                        color: mode === 'webrtc' ? '#000' : 'var(--text-muted)',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                >
                    🌐 Browser P2P
                </button>
                <button
                    onClick={() => setMode('agent')}
                    style={{
                        background: mode === 'agent' ? '#ff9800' : 'transparent',
                        color: mode === 'agent' ? '#000' : 'var(--text-muted)',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                >
                    🚀 Local Agent
                </button>

            </div>

            {/* Render Active Component */}
            <div style={{ width: '100%' }}>
                {mode === 'webrtc' ? (
                    <WebRTCTransfer {...props} />
                ) : (
                    <LocalTransfer {...props} />
                )}
            </div>

        </div>
    );
};

export default FileTransfer;
