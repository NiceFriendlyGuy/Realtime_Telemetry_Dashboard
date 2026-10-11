export interface Reading {
    nodeId: string;
    metric: string;
    unit: string;
    value: number;
    timestamp: string;
    anomaly: boolean;
    detectedAnomaly: boolean;
}

export interface HistoryPoint {
    time: string;
    value: number;
    anomaly: boolean;
    detectedAnomaly: boolean;
}

export interface NodeState {
    nodeId: string;
    lastSeen: string;
    status: 'healthy' | 'warning' | 'offline';
}

export type GatewayMessage = 
| { type: 'reading'; payload: Reading } 
| { type: 'nodeState'; payload: NodeState } 
| { type: 'nodeRemoved'; payload: { nodeId: string } }
| { type: 'snapshot'; payload: NodeState[] };