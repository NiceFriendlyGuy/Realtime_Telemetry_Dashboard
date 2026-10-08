import { Service } from '@angular/core';
import { NodeState, GatewayMessage, Reading } from '../models/telemetry';
import { signal, computed } from '@angular/core';

@Service()
export class TelemetrySocket {
    private socket?: WebSocket;

    private nodes = signal<Record<string, NodeState>>({});
    public readonly nodeList = computed(() => Object.values(this.nodes()));

    private readings = signal<Record<string, Record<string, Reading>>>({});
    readonly readingsByNode = computed(() => this.readings());

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
            else if(message.type === 'reading') {
                this.readings.update(current => {
                    const nodeReadings = current[message.payload.nodeId] ?? {};

                    return {
                        ...current,
                        [message.payload.nodeId]: {
                            ...nodeReadings,
                            [message.payload.metric]: message.payload,
                        },
                    };
                });
            }
            if (message.type === 'nodeRemoved') {
                const { nodeId } = message.payload;

                this.nodes.update(current => {
                    const next = { ...current };
                    delete next[nodeId];
                    return next;
                });

                this.readings.update(current => {
                    const next = { ...current };
                    delete next[nodeId];
                    return next;
                });
            }
        };
    }
}