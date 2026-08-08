import { Service } from '@angular/core';

@Service()
export class TelemetrySocket {
    private socket?: WebSocket;

    connect(): void {
        this.socket = new WebSocket('ws://localhost:3000/ws');
        
        this.socket.onopen = () => {
            console.log('Connected to backend WebSocket');
        };

        this.socket.onmessage = (event) => {
            console.log('Recieved:', event.data);
        };
    }
}
