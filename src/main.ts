import * as core from '@actions/core';
import { AppRunApiClient } from './api-client';
import type { ApplicationSummary } from './types';
import {
  parseApplicationIDs,
  validateUuid,
  validateImageName,
  findActiveVersion,
  prepareNewVersionConfig
} from './utils';

interface UpdateResult {
  applicationID: string;
  applicationName: string;
  version: number;
  activeVersion: number;
}

function parseNames(input: string): string[] {
  return input.split(',').map(name => name.trim()).filter(name => name.length > 0);
}

async function resolveApplicationIDs(
  client: AppRunApiClient,
  applicationIDInput: string,
  applicationNameInput: string
): Promise<string[]> {
  const applicationIDs: string[] = [];

  // Parse applicationID input
  if (applicationIDInput) {
    const ids = parseApplicationIDs(applicationIDInput);
    applicationIDs.push(...ids);
  }

  // Parse applicationName input and resolve to IDs
  if (applicationNameInput) {
    const names = parseNames(applicationNameInput);
    if (names.length > 0) {
      core.info('Fetching application list to resolve names...');
      const response = await client.listApplications();
      const appMap = new Map<string, ApplicationSummary>();
      for (const app of response.applications) {
        appMap.set(app.name, app);
      }

      for (const name of names) {
        const app = appMap.get(name);
        if (!app) {
          const availableNames = response.applications.map(a => a.name).join(', ');
          throw new Error(`Application "${name}" not found. Available applications: ${availableNames}`);
        }
        // Avoid duplicates if same app specified by both ID and name
        if (!applicationIDs.includes(app.applicationID)) {
          applicationIDs.push(app.applicationID);
        }
        core.info(`Resolved "${name}" -> ${app.applicationID}`);
      }
    }
  }

  if (applicationIDs.length === 0) {
    throw new Error('Either applicationID or applicationName must be specified');
  }

  return applicationIDs;
}

async function updateApplication(
  client: AppRunApiClient,
  applicationID: string,
  newImage: string,
  shouldActivate: boolean
): Promise<UpdateResult> {
  core.info(`\n--- Processing application ${applicationID} ---`);

  core.info(`Fetching application info for ${applicationID}...`);
  const appResponse = await client.getApplication(applicationID);
  const applicationName = appResponse.application.name;
  core.info(`Application name: ${applicationName}`);

  core.info(`Fetching version list for application ${applicationID}...`);
  const versionsResponse = await client.listVersions(applicationID);

  core.debug(`Versions response: ${JSON.stringify(versionsResponse, null, 2)}`);

  if (!versionsResponse.versions || versionsResponse.versions.length === 0) {
    core.error(`No versions found. Response: ${JSON.stringify(versionsResponse, null, 2)}`);
    throw new Error(`No versions found for application ${applicationID}`);
  }

  core.info(`Found ${versionsResponse.versions.length} version(s)`);

  const activeVersionNumber = findActiveVersion(versionsResponse.versions);

  if (!activeVersionNumber) {
    throw new Error(`Could not determine active version for application ${applicationID}`);
  }

  core.info(`Fetching details for version ${activeVersionNumber}...`);
  const versionDetails = await client.getVersion(applicationID, activeVersionNumber);
  const currentConfig = versionDetails.applicationVersion;

  core.info(`Current image: ${currentConfig.image}`);
  core.info(`New image: ${newImage}`);

  if (currentConfig.image === newImage) {
    core.warning(`Image is already set to ${newImage}. No update needed.`);
    return {
      applicationID,
      applicationName,
      version: activeVersionNumber,
      activeVersion: activeVersionNumber
    };
  }

  core.info('Preparing new version configuration...');
  const newVersionConfig = prepareNewVersionConfig(currentConfig, newImage);

  core.info('Creating new version...');
  const createResponse = await client.createVersion(applicationID, newVersionConfig);
  const newVersionNumber = createResponse.applicationVersion.version;

  core.info(`Created new version: ${newVersionNumber}`);

  if (shouldActivate) {
    core.info(`Activating version ${newVersionNumber}...`);
    await client.activateVersion(applicationID, newVersionNumber);
    core.info(`Successfully activated version ${newVersionNumber} with image ${newImage}`);
    return {
      applicationID,
      applicationName,
      version: newVersionNumber,
      activeVersion: newVersionNumber
    };
  } else {
    core.info(`Version ${newVersionNumber} created but not activated (activate=false)`);
    core.info(`To activate this version later, update the application's activeVersion to ${newVersionNumber}`);
    return {
      applicationID,
      applicationName,
      version: newVersionNumber,
      activeVersion: activeVersionNumber
    };
  }
}

async function run(): Promise<void> {
  try {
    const applicationIDInput = core.getInput('applicationID', { required: false });
    const applicationNameInput = core.getInput('applicationName', { required: false });
    const sakuraAccessToken = core.getInput('sakuraAccessToken', { required: true });
    const sakuraAccessTokenSecret = core.getInput('sakuraAccessTokenSecret', { required: true });
    const newImage = core.getInput('image', { required: true });
    const shouldActivate = core.getInput('activate', { required: false }) !== 'false';

    core.info('Validating inputs...');
    validateUuid(sakuraAccessToken, 'sakuraAccessToken');
    validateImageName(newImage);

    const client = new AppRunApiClient(sakuraAccessToken, sakuraAccessTokenSecret);

    const applicationIDs = await resolveApplicationIDs(client, applicationIDInput, applicationNameInput);
    core.info(`Processing ${applicationIDs.length} application(s)...`);

    const results: UpdateResult[] = [];
    for (const applicationID of applicationIDs) {
      const result = await updateApplication(client, applicationID, newImage, shouldActivate);
      results.push(result);
    }

    core.info('\n--- Summary ---');
    for (const result of results) {
      core.info(`Application ${result.applicationName} (${result.applicationID}): version=${result.version}, activeVersion=${result.activeVersion}`);
    }

    const applicationNames = results.map(r => r.applicationName).join(',');
    const versions = results.map(r => r.version).join(',');
    const activeVersions = results.map(r => r.activeVersion).join(',');

    core.setOutput('applicationNames', applicationNames);
    core.setOutput('version', versions);
    core.setOutput('activeVersion', activeVersions);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
