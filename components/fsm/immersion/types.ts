export interface StateStat {
    stateId: string;
    name: string;
    count: number;
    isTerminal: boolean;
    isInitial: boolean;
}

export interface UserDetail {
    userId: string;
    username: string;
    fullName: string;
    credits: number;
    lastActiveAt: string;
    enteredStateAt: string;
    activeOverlays: string[];
}
