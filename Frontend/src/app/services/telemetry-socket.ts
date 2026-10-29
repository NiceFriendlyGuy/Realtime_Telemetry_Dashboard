import { Service } from '@angular/core';
import { NodeState, GatewayMessage, Reading, Alert } from '../models/telemetry';
import { signal, computed } from '@angular/core';

const MAX_ALERTS = 50;
export const RESOLVED_ALERT_TTL_MS = 60_000;

@Service()
export class TelemetrySocket {
    private socket?: WebSocket;

    private nodes = signal<Record<string, NodeState>>({});
    public readonly nodeList = computed(() => Object.values(this.nodes()));

    private readings = signal<Record<string, Record<string, Reading>>>({});
    readonly readingsByNode = computed(() => this.readings());

    private reconnectAttempt = 0;


    private alerts = signal<Alert[]>([]);
    readonly alertFeed = this.alerts.asReadonly();
        

    connect(): void {
        if (this.socket && this.socket.readyState <= WebSocket.OPEN) {
            return;
        }

        const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
        this.socket = new WebSocket(`${scheme}://${location.host}/ws`);
        //this.socket = new WebSocket('ws://localhost:3000/ws');
        
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
                this.nodes.set(Object.fromEntries(message.payload.nodes.map((n) => [n.nodeId, n])));
                this.alerts.update((current) => [
                    ...message.payload.alerts,
                    ...current.filter((a) => a.status === 'resolved'),
                ]);
            }

            else if (message.type === 'alert') {
                const incoming = message.payload;

                this.alerts.update((current) =>
                    [incoming, ...current.filter((a) => a.id !== incoming.id)].slice(0, MAX_ALERTS),
                );

                if (incoming.status === 'resolved') {
                    setTimeout(() => {
                        this.alerts.update((current) => current.filter((a) => a.id !== incoming.id));
                    }, RESOLVED_ALERT_TTL_MS);
                }
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