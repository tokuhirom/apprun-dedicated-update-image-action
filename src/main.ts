import * as core from '@actions/core';
import { AppRunApiClient } from './api-client';
import {
  validateUuid,
  validateImageName,
  findActiveVersion,
  prepareNewVersionConfig
} from './utils';

async function run(): Promise<void> {
  try {
    const applicationID = core.getInput('applicationID', { required: true });
    const sakuraAccessToken = core.getInput('sakuraAccessToken', { required: true });
    const sakuraAccessTokenSecret = core.getInput('sakuraAccessTokenSecret', { required: true });
    const newImage = core.getInput('image', { required: true });

    core.info('Validating inputs...');
    validateUuid(applicationID, 'applicationID');
    validateUuid(sakuraAccessToken, 'sakuraAccessToken');
    validateImageName(newImage);

    const client = new AppRunApiClient(sakuraAccessToken, sakuraAccessTokenSecret);

    core.info(`Fetching version list for application ${applicationID}...`);
    const versionsResponse = await client.listVersions(applicationID);

    if (!versionsResponse.applicationVersions || versionsResponse.applicationVersions.length === 0) {
      throw new Error('No versions found for this application');
    }

    core.info(`Found ${versionsResponse.applicationVersions.length} version(s)`);

    const activeVersionNumber = findActiveVersion(versionsResponse.applicationVersions);

    if (!activeVersionNumber) {
      throw new Error('Could not determine active version');
    }

    core.info(`Fetching details for version ${activeVersionNumber}...`);
    const versionDetails = await client.getVersion(applicationID, activeVersionNumber);
    const currentConfig = versionDetails.applicationVersion;

    core.info(`Current image: ${currentConfig.image}`);
    core.info(`New image: ${newImage}`);

    if (currentConfig.image === newImage) {
      core.warning(`Image is already set to ${newImage}. No update needed.`);
      core.setOutput('activeVersion', activeVersionNumber);
      return;
    }

    core.info('Preparing new version configuration...');
    const newVersionConfig = prepareNewVersionConfig(currentConfig, newImage);

    core.info('Creating new version...');
    const createResponse = await client.createVersion(applicationID, newVersionConfig);
    const newVersionNumber = createResponse.applicationVersion.version;

    core.info(`Created new version: ${newVersionNumber}`);

    core.info(`Activating version ${newVersionNumber}...`);
    await client.activateVersion(applicationID, newVersionNumber);

    core.info(`Successfully activated version ${newVersionNumber} with image ${newImage}`);

    core.setOutput('activeVersion', newVersionNumber);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
