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

export interface Alert {
    id: string;
    nodeId: string;
    metric: string;
    unit: string;
    status: 'active' | 'resolved';
    startedAt: string;
    resolvedAt: string | null;
    worstValue: number;
}

export type GatewayMessage =
    | { type: 'reading'; payload: Reading }
    | { type: 'nodeState'; payload: NodeState }
    | { type: 'nodeRemoved'; payload: { nodeId: string } }
    | { type: 'alert'; payload: Alert }
    | { type: 'snapshot'; payload: { nodes: NodeState[]; alerts: Alert[] } 
};
