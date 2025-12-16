export interface ApplicationVersionConfig {
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
  registryPasswordAction: 'keep' | 'update' | 'delete';
  exposedPorts: ExposedPort[];
  env: EnvironmentVariable[];
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

export interface EnvironmentVariable {
  key: string;
  value: string | null;
  valueAction: 'keep' | 'update' | 'delete';
}

export interface ApplicationVersionSummary {
  version: number;
  image: string;
  activeNodeCount: number;
  created: number;
}

export interface ListVersionsResponse {
  applicationVersions: ApplicationVersionSummary[];
  cursor?: number;
}

export interface GetVersionResponse {
  applicationVersion: ApplicationVersionConfig & {
    activeNodeCount: number;
    created: number;
  };
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
