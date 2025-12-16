import type { ApplicationVersionSummary, ApplicationVersionConfig } from './types';
export declare function validateUuid(value: string, fieldName: string): void;
export declare function validateImageName(image: string): void;
export declare function findActiveVersion(versions: ApplicationVersionSummary[]): number | null;
export declare function prepareNewVersionConfig(existingConfig: ApplicationVersionConfig, newImage: string): Omit<ApplicationVersionConfig, 'version'>;
