import * as core from '@actions/core';
import type { ApplicationVersionSummary, ApplicationVersionConfig } from './types';

export function validateUuid(value: string, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    throw new Error(`${fieldName} must be a valid UUID format`);
  }
}

export function validateImageName(image: string): void {
  if (!image || image.trim().length === 0) {
    throw new Error('Image name cannot be empty');
  }

  if (image.length > 512) {
    throw new Error('Image name cannot exceed 512 characters');
  }

  const imageRegex = /^[a-zA-Z0-9][a-zA-Z0-9._\/-]*[a-zA-Z0-9](:[a-zA-Z0-9._-]+)?$/;
  if (!imageRegex.test(image)) {
    throw new Error(`Invalid image name format: ${image}`);
  }
}

export function findActiveVersion(versions: ApplicationVersionSummary[]): number | null {
  const sorted = [...versions].sort((a, b) => b.version - a.version);
  const active = sorted.find(v => v.activeNodeCount > 0);

  if (active) {
    core.info(`Found active version: ${active.version} (image: ${active.image})`);
    return active.version;
  }

  if (sorted.length > 0) {
    core.warning(`No active version found, using latest version: ${sorted[0].version}`);
    return sorted[0].version;
  }

  return null;
}

export function prepareNewVersionConfig(
  existingConfig: ApplicationVersionConfig,
  newImage: string
): Omit<ApplicationVersionConfig, 'version'> {
  const newConfig: Omit<ApplicationVersionConfig, 'version'> = {
    cpu: existingConfig.cpu,
    memory: existingConfig.memory,
    scalingMode: existingConfig.scalingMode,
    image: newImage,
    registryUsername: existingConfig.registryUsername,
    registryPassword: existingConfig.registryPassword,
    registryPasswordAction: 'keep' as const,
    exposedPorts: existingConfig.exposedPorts,
    env: existingConfig.env.map((e) => ({
      key: e.key,
      value: e.value,
      valueAction: 'keep' as const
    }))
  };

  if (existingConfig.fixedScale !== undefined) {
    newConfig.fixedScale = existingConfig.fixedScale;
  }
  if (existingConfig.minScale !== undefined) {
    newConfig.minScale = existingConfig.minScale;
  }
  if (existingConfig.maxScale !== undefined) {
    newConfig.maxScale = existingConfig.maxScale;
  }
  if (existingConfig.scaleInThreshold !== undefined) {
    newConfig.scaleInThreshold = existingConfig.scaleInThreshold;
  }
  if (existingConfig.scaleOutThreshold !== undefined) {
    newConfig.scaleOutThreshold = existingConfig.scaleOutThreshold;
  }
  if (existingConfig.cmd !== undefined) {
    newConfig.cmd = existingConfig.cmd;
  }

  return newConfig;
}
