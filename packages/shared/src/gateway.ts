export const GatewayOpcode = {
    Dispatch: 0,
    Heartbeat: 1,
    Identify: 2,
    Subscribe: 3,
    Unsubscribe: 4,
    Reconnect: 7,
    Hello: 10,
    HeartbeatAck: 11
} as const;

export const GatewayCloseCode = {
    UnknownError: 4000,
    UnknownOpcode: 4001,
    DecodeError: 4002,
    NotAuthenticated: 4003,
    AuthenticationFailed: 4004,
    AlreadyAuthenticated: 4005,
    RateLimited: 4008,
    SessionTimedOut: 4009,
    InvalidVersion: 4012
} as const;

export const gatewayVersion = 1;

export const fatalGatewayCloseCodes: readonly number[] = [4004, 4010, 4011, 4012, 4013, 4014];

export type SessionIssue = 'expired' | 'disabled' | null;

export interface GatewayTodo {
    id: string;
    title: string;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GatewaySession {
    id: string;
    userAgent: string | null;
    ipAddress: string | null;
    isCurrent: boolean;
    onlineConnections?: number;
}

export interface GatewayUserProfile {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
}

export interface GatewayReady<User> {
    v: number;
    user: User | null;
    users: GatewayUserProfile[];
    todos: GatewayTodo[];
    sessions: GatewaySession[];
}

export interface GatewayDispatchData<User = unknown> {
    READY: GatewayReady<User>;
    CURRENT_USER_UPDATE: User;
    USER_UPDATE: GatewayUserProfile;
    TODO_LIST_UPDATE: GatewayTodo[];
    SESSIONS_UPDATE: GatewaySession[];
    SESSION_REVOKED: {
        code: 'SESSION_EXPIRED' | 'USER_DISABLED' | 'LOGGED_OUT';
    };
}

export type GatewayDispatch<User = unknown> = {
    [Name in keyof GatewayDispatchData<User>]: {
        op: 0;
        d: GatewayDispatchData<User>[Name];
        t: Name;
    };
}[keyof GatewayDispatchData<User>];

export type GatewayServerPacket<User = unknown> =
    | GatewayDispatch<User>
    | {
          op: 10;
          d: {
              heartbeat_interval: number;
          };
          t: null;
      }
    | {
          op: 1 | 7 | 11;
          d: null;
          t: null;
      };

export interface GatewayIdentify {
    anonymous?: boolean;
    properties?: {
        os?: string;
        browser?: string;
        device?: string;
    };
}
