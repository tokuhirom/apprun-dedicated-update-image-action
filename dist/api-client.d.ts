import type { ListVersionsResponse, GetVersionResponse, CreateVersionResponse, CreateApplicationVersionConfig, GetApplicationResponse } from './types';
export declare class AppRunApiClient {
    private client;
    private baseUrl;
    private authHeader;
    constructor(accessToken: string, accessTokenSecret: string);
    getApplication(applicationId: string): Promise<GetApplicationResponse>;
    listVersions(applicationId: string): Promise<ListVersionsResponse>;
    getVersion(applicationId: string, version: number): Promise<GetVersionResponse>;
    createVersion(applicationId: string, config: CreateApplicationVersionConfig): Promise<CreateVersionResponse>;
    activateVersion(applicationId: string, version: number): Promise<void>;
    private handleError;
}
