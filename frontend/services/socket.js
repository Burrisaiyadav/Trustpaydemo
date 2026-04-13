// ── TRUSTPAY STOMP/SOCKJS CLIENT (REPLACE SOCKET.IO) ──
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import api from './api.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080/ws-trustpay';

let stompClient = null;
let socket = null;

export const connectSocket = (claimID, onMessage, onResult) => {
  if (stompClient && stompClient.connected) return stompClient;

  socket = new SockJS(SOCKET_URL);
  stompClient = Stomp.over(socket);
  stompClient.debug = null; // Disable logging

  stompClient.connect({}, (frame) => {
    console.log('[STOMP] Connected');
    
    // Subscribe to claim processing steps
    if (claimID) {
      stompClient.subscribe(`/topic/claim/${claimID}`, (message) => {
        if (onMessage) onMessage(JSON.parse(message.body));
      });

      stompClient.subscribe(`/topic/claim/${claimID}/result`, (message) => {
        if (onResult) onResult(JSON.parse(message.body));
      });
    }
  }, (error) => {
    console.warn('[STOMP] Connection error:', error);
  });

  return stompClient;
};

export const disconnectSocket = () => {
  if (stompClient) {
    stompClient.disconnect();
    stompClient = null;
  }
};

export default { connectSocket, disconnectSocket };
