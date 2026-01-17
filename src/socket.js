import io from 'socket.io-client';

// Automatically detect if we are on localhost or a network IP
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_PORT = 3001;

// If we are on network IP (e.g. 192.168.1.5), connect to that IP:3001
// If on localhost, connect to localhost:3001
const backendUrl = `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`;

console.log(`Socket connecting to: ${backendUrl}`);

const socket = io(backendUrl);

export default socket;
