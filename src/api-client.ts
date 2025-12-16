import * as core from '@actions/core';
import { HttpClient } from '@actions/http-client';
import type {
  ListVersionsResponse,
  GetVersionResponse,
  CreateVersionResponse,
  CreateApplicationVersionConfig,
  UpdateApplicationRequest,
  ApiError
} from './types';

export class AppRunApiClient {
  private client: HttpClient;
  private baseUrl = 'https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0';
  private authHeader: string;

  constructor(accessToken: string, accessTokenSecret: string) {
    this.client = new HttpClient('apprun-dedicated-update-image-action');

    const credentials = Buffer.from(`${accessToken}:${accessTokenSecret}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  async listVersions(applicationId: string): Promise<ListVersionsResponse> {
    const url = `${this.baseUrl}/applications/${applicationId}/versions?maxItems=30`;

    core.debug(`Fetching versions from: ${url}`);

    const response = await this.client.get(url, {
      Authorization: this.authHeader
    });

    const statusCode = response.message.statusCode;
    core.debug(`Response status code: ${statusCode}`);

    if (statusCode !== 200) {
      throw await this.handleError(response);
    }

    const body = await response.readBody();
    core.debug(`Response body: ${body}`);
    return JSON.parse(body);
  }

  async getVersion(applicationId: string, version: number): Promise<GetVersionResponse> {
    const url = `${this.baseUrl}/applications/${applicationId}/versions/${version}`;

    core.debug(`Fetching version ${version} from: ${url}`);

    const response = await this.client.get(url, {
      Authorization: this.authHeader
    });

    const statusCode = response.message.statusCode;
    core.debug(`Response status code: ${statusCode}`);

    if (statusCode !== 200) {
      throw await this.handleError(response);
    }

    const body = await response.readBody();
    core.debug(`Response body: ${body}`);
    return JSON.parse(body);
  }

  async createVersion(
    applicationId: string,
    config: CreateApplicationVersionConfig
  ): Promise<CreateVersionResponse> {
    const url = `${this.baseUrl}/applications/${applicationId}/versions`;

    const requestBody = JSON.stringify(config);
    core.debug(`Creating new version at: ${url}`);
    core.debug(`Request body: ${requestBody}`);

    const response = await this.client.post(url, requestBody, {
      Authorization: this.authHeader,
      'Content-Type': 'application/json'
    });

    const statusCode = response.message.statusCode;
    core.debug(`Response status code: ${statusCode}`);

    if (statusCode !== 200) {
      throw await this.handleError(response);
    }

    const body = await response.readBody();
    core.debug(`Response body: ${body}`);
    return JSON.parse(body);
  }

  async activateVersion(applicationId: string, version: number): Promise<void> {
    const url = `${this.baseUrl}/applications/${applicationId}`;

    core.debug(`Activating version ${version} at: ${url}`);

    const body: UpdateApplicationRequest = {
      activeVersion: version
    };

    const response = await this.client.put(url, JSON.stringify(body), {
      Authorization: this.authHeader,
      'Content-Type': 'application/json'
    });

    const statusCode = response.message.statusCode;
    core.debug(`Response status code: ${statusCode}`);

    if (statusCode !== 204) {
      throw await this.handleError(response);
    }
  }

  private async handleError(response: any): Promise<Error> {
    const statusCode = response.message.statusCode;
    let errorMessage = `API request failed with status ${statusCode}`;

    try {
      const body = await response.readBody();
      core.error(`Error response body: ${body}`);
      const error: ApiError = JSON.parse(body);
      errorMessage = `API Error (${statusCode}): ${error.errorCode} - ${error.message}`;
    } catch (e) {
      core.error(`Failed to parse error response: ${e}`);
    }

    return new Error(errorMessage);
  }
}
