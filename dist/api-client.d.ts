import type { ListVersionsResponse, GetVersionResponse, CreateVersionResponse, ApplicationVersionConfig } from './types';
export declare class AppRunApiClient {
    private client;
    private baseUrl;
    private authHeader;
    constructor(accessToken: string, accessTokenSecret: string);
    listVersions(applicationId: string): Promise<ListVersionsResponse>;
    getVersion(applicationId: string, version: number): Promise<GetVersionResponse>;
    createVersion(applicationId: string, config: Omit<ApplicationVersionConfig, 'version'>): Promise<CreateVersionResponse>;
    activateVersion(applicationId: string, version: number): Promise<void>;
    private handleError;
}
