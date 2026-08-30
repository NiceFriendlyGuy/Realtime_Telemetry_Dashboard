import { Service } from '@angular/core';
import { NodeState, GatewayMessage } from '../models/telemetry';
import { signal, computed } from '@angular/core';

@Service()
export class TelemetrySocket {
    private socket?: WebSocket;

    private nodes = signal<Record<string, NodeState>>({});
    public readonly nodeList = computed(() => Object.values(this.nodes()));

    connect(): void {
        this.socket = new WebSocket('ws://localhost:3000/ws');
        
        this.socket.onopen = () => {
            console.log('Connected to backend WebSocket');
        };

        this.socket.onmessage = (event) => {
            const message: GatewayMessage = JSON.parse(event.data);
            console.log('Recieved:', event.data);
            if (message.type === 'nodeState'){
                this.nodes.update(current => ({ ...current, [message.payload.nodeId]: message.payload }));
            }
        };
    }
}