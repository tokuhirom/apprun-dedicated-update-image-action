export interface ReadApplicationVersionConfig {
    version?: number;
    cpu: number;
    memory: number;
    scalingMode: 'cpu' | 'fixed';
    fixedScale?: number;
    minScale?: number;
    maxScale?: number;
    scaleInThreshold?: number;
    scaleOutThreshold?: number;
    image: string;
    cmd?: string[];
    registryUsername: string | null;
    registryPassword: string | null;
    exposedPorts: ExposedPort[];
    env: ReadEnvironmentVariable[];
    activeNodeCount: number;
    created: number;
}
export interface CreateApplicationVersionConfig {
    cpu: number;
    memory: number;
    scalingMode: 'cpu' | 'fixed';
    fixedScale?: number;
    minScale?: number;
    maxScale?: number;
    scaleInThreshold?: number;
    scaleOutThreshold?: number;
    image: string;
    cmd?: string[];
    registryUsername: string | null;
    registryPassword: string | null;
    registryPasswordAction: 'keep' | 'update' | 'delete';
    exposedPorts: ExposedPort[];
    env: CreateEnvironmentVariable[];
}
export interface ExposedPort {
    targetPort: number;
    loadBalancerPort?: number;
    useLetsEncrypt?: boolean;
    host?: string[];
    healthCheck?: {
        path: string;
        intervalSeconds: number;
        timeoutSeconds: number;
    };
}
export interface ReadEnvironmentVariable {
    key: string;
    value: string | null;
    secret: boolean;
}
export interface CreateEnvironmentVariable {
    key: string;
    value?: string;
    secret: boolean;
}
export interface ApplicationVersionSummary {
    version: number;
    image: string;
    activeNodeCount: number;
    created: number;
}
export interface ListVersionsResponse {
    versions: ApplicationVersionSummary[];
    cursor?: number;
}
export interface GetVersionResponse {
    applicationVersion: ReadApplicationVersionConfig;
}
export interface CreateVersionResponse {
    applicationVersion: {
        version: number;
    };
}
export interface UpdateApplicationRequest {
    activeVersion: number | null;
}
export interface ApiError {
    errorCode: string;
    message: string;
}
