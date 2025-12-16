import type { ApplicationVersionSummary, ReadApplicationVersionConfig, CreateApplicationVersionConfig } from './types';
export declare function validateUuid(value: string, fieldName: string): void;
export declare function validateImageName(image: string): void;
export declare function findActiveVersion(versions: ApplicationVersionSummary[]): number | null;
export declare function prepareNewVersionConfig(existingConfig: ReadApplicationVersionConfig, newImage: string): CreateApplicationVersionConfig;
