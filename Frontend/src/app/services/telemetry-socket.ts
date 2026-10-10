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

    private reconnectAttempt = 0;

    connect(): void {
        this.socket = new WebSocket('ws://localhost:3000/ws');
        
        this.socket.onopen = () => {
            console.log('Connected to backend WebSocket');
            this.reconnectAttempt = 0;
        };

        this.socket.onclose = () => {
            const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 10_000);
            this.reconnectAttempt++;
            console.warn(`WebSocket closed, retrying in ${delay}ms`);
            setTimeout(() => this.connect(), delay);
        };

        this.socket.onmessage = (event) => {
            const message: GatewayMessage = JSON.parse(event.data);
            console.log('Recieved:', event.data);

            if (message.type === 'snapshot') {
                this.nodes.set(Object.fromEntries(message.payload.map(n => [n.nodeId, n])));
            }
            else if (message.type === 'nodeState'){
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