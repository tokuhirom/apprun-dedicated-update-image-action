import {
  validateUuid,
  validateImageName,
  findActiveVersion,
  prepareNewVersionConfig
} from '../src/utils';
import type { ApplicationVersionSummary, ApplicationVersionConfig } from '../src/types';

describe('Input Validation', () => {
  describe('validateUuid', () => {
    test('accepts valid UUIDs', () => {
      expect(() => validateUuid('123e4567-e89b-12d3-a456-426614174000', 'test')).not.toThrow();
      expect(() => validateUuid('550e8400-e29b-41d4-a716-446655440000', 'test')).not.toThrow();
    });

    test('rejects invalid UUIDs', () => {
      expect(() => validateUuid('invalid-uuid', 'test')).toThrow('test must be a valid UUID format');
      expect(() => validateUuid('123', 'test')).toThrow('test must be a valid UUID format');
      expect(() => validateUuid('', 'test')).toThrow('test must be a valid UUID format');
    });
  });

  describe('validateImageName', () => {
    test('accepts valid image names', () => {
      expect(() => validateImageName('nginx:latest')).not.toThrow();
      expect(() => validateImageName('registry.example.com/app:v1.0')).not.toThrow();
      expect(() => validateImageName('myapp')).not.toThrow();
      expect(() => validateImageName('ghcr.io/user/repo:tag')).not.toThrow();
    });

    test('rejects invalid image names', () => {
      expect(() => validateImageName('')).toThrow('Image name cannot be empty');
      expect(() => validateImageName('   ')).toThrow('Image name cannot be empty');
      expect(() => validateImageName('a'.repeat(513))).toThrow('Image name cannot exceed 512 characters');
    });
  });
});

describe('Version Management', () => {
  describe('findActiveVersion', () => {
    test('finds version with active nodes', () => {
      const versions: ApplicationVersionSummary[] = [
        { version: 1, image: 'nginx:1', activeNodeCount: 0, created: 100 },
        { version: 2, image: 'nginx:2', activeNodeCount: 3, created: 200 },
        { version: 3, image: 'nginx:3', activeNodeCount: 0, created: 300 }
      ];
      expect(findActiveVersion(versions)).toBe(2);
    });

    test('returns latest version when no active nodes', () => {
      const versions: ApplicationVersionSummary[] = [
        { version: 1, image: 'nginx:1', activeNodeCount: 0, created: 100 },
        { version: 2, image: 'nginx:2', activeNodeCount: 0, created: 200 },
        { version: 3, image: 'nginx:3', activeNodeCount: 0, created: 300 }
      ];
      expect(findActiveVersion(versions)).toBe(3);
    });

    test('returns null for empty array', () => {
      expect(findActiveVersion([])).toBeNull();
    });

    test('finds highest active version when multiple are active', () => {
      const versions: ApplicationVersionSummary[] = [
        { version: 1, image: 'nginx:1', activeNodeCount: 2, created: 100 },
        { version: 2, image: 'nginx:2', activeNodeCount: 0, created: 200 },
        { version: 3, image: 'nginx:3', activeNodeCount: 5, created: 300 }
      ];
      expect(findActiveVersion(versions)).toBe(3);
    });
  });

  describe('prepareNewVersionConfig', () => {
    test('copies all required fields and updates image', () => {
      const existing: ApplicationVersionConfig = {
        cpu: 500,
        memory: 1024,
        scalingMode: 'cpu',
        minScale: 1,
        maxScale: 3,
        image: 'old:latest',
        registryUsername: null,
        registryPassword: null,
        registryPasswordAction: 'keep',
        exposedPorts: [],
        env: [{ key: 'FOO', value: 'bar', valueAction: 'keep' }]
      };

      const result = prepareNewVersionConfig(existing, 'new:latest');

      expect(result.image).toBe('new:latest');
      expect(result.cpu).toBe(500);
      expect(result.memory).toBe(1024);
      expect(result.scalingMode).toBe('cpu');
      expect(result.minScale).toBe(1);
      expect(result.maxScale).toBe(3);
      expect(result.registryPasswordAction).toBe('keep');
      expect(result.env).toHaveLength(1);
      expect(result.env[0].valueAction).toBe('keep');
    });

    test('preserves optional fields', () => {
      const existing: ApplicationVersionConfig = {
        cpu: 1000,
        memory: 2048,
        scalingMode: 'fixed',
        fixedScale: 2,
        scaleInThreshold: 30,
        scaleOutThreshold: 70,
        image: 'old:v1',
        cmd: ['npm', 'start'],
        registryUsername: 'user',
        registryPassword: null,
        registryPasswordAction: 'keep',
        exposedPorts: [
          {
            targetPort: 8080,
            loadBalancerPort: 80
          }
        ],
        env: []
      };

      const result = prepareNewVersionConfig(existing, 'new:v2');

      expect(result.fixedScale).toBe(2);
      expect(result.scaleInThreshold).toBe(30);
      expect(result.scaleOutThreshold).toBe(70);
      expect(result.cmd).toEqual(['npm', 'start']);
      expect(result.exposedPorts).toHaveLength(1);
      expect(result.exposedPorts[0].targetPort).toBe(8080);
    });

    test('sets env valueAction to keep', () => {
      const existing: ApplicationVersionConfig = {
        cpu: 500,
        memory: 1024,
        scalingMode: 'cpu',
        image: 'old:latest',
        registryUsername: null,
        registryPassword: null,
        registryPasswordAction: 'keep',
        exposedPorts: [],
        env: [
          { key: 'API_KEY', value: null, valueAction: 'update' },
          { key: 'DEBUG', value: 'true', valueAction: 'update' }
        ]
      };

      const result = prepareNewVersionConfig(existing, 'new:latest');

      expect(result.env).toHaveLength(2);
      result.env.forEach(envVar => {
        expect(envVar.valueAction).toBe('keep');
      });
    });
  });
});
