import { AttackParamLocation } from './models';
import { ScanSettings, ScanSettingsOptions } from './ScanSettings';
import { randomBytes } from 'crypto';

describe('ScanSettings', () => {
  describe('constructor', () => {
    it.each([
      { input: { tests: [] }, expected: 'Please provide at least one test' },
      {
        input: {
          attackParamLocations: ['xxx' as AttackParamLocation]
        },
        expected: 'Unknown attack param location supplied'
      },
      {
        input: {
          poolSize: 51
        },
        expected: 'Invalid pool size'
      },
      {
        input: {
          poolSize: 0
        },
        expected: 'Invalid pool size'
      },
      {
        input: {
          requestsRateLimit: 1001
        },
        expected: 'Invalid requests rate limit'
      },
      {
        input: {
          requestsRateLimit: -1
        },
        expected: 'Invalid requests rate limit'
      }
    ])(
      'should raise the error `$expected` when invalid config ($input) is supplied',
      ({ input, expected }) => {
        // arrange
        const settings: ScanSettingsOptions = {
          target: { url: 'https://example.com' },
          tests: ['xpathi'],
          ...input
        };

        // act & assert
        expect(() => new ScanSettings(settings)).toThrow(expected);
      }
    );

    it('should create a settings with unique attack locations', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        target: { url: 'https://example.com' },
        tests: ['xpathi'],
        attackParamLocations: [
          AttackParamLocation.QUERY,
          AttackParamLocation.QUERY
        ]
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result).toMatchObject({
        attackParamLocations: [AttackParamLocation.QUERY]
      });
    });

    it.each([
      {
        input: { query: { a: '1' } },
        expected: [AttackParamLocation.QUERY],
        name: 'query supplied'
      },
      {
        input: {
          method: 'POST',
          body: 'a=1',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        },
        expected: [AttackParamLocation.BODY],
        name: 'body supplied'
      }
    ])(
      'should create a settings resolving attack locations when $name',
      ({ input, expected }) => {
        // arrange
        const settings: ScanSettingsOptions = {
          target: { url: 'https://example.com', ...input },
          tests: ['xpathi']
        };

        // act
        const result = new ScanSettings(settings);

        // assert
        expect(result).toMatchObject({
          attackParamLocations: expected
        });
      }
    );

    it('should create a settings with unique tests', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        target: { url: 'https://example.com' },
        tests: ['xpathi', 'xpathi']
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result).toMatchObject({
        tests: ['xpathi']
      });
    });

    it('should create a settings with custom name', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        name: 'my scan',
        tests: ['xss'],
        target: { url: 'https://example.com' }
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result).toMatchObject({
        name: 'my scan'
      });
    });

    it('should create a settings with default name', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        tests: ['xss'],
        target: { url: 'https://example.com/users/1' }
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result).toMatchObject({
        name: 'GET /users/1'
      });
    });

    it('should throw an error if name is greater than 200 characters', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        name: randomBytes(201).toString('hex'),
        tests: ['xss'],
        target: { url: 'https://example.com/users/1' }
      };

      // act & assert
      expect(() => new ScanSettings(settings)).toThrow(
        'Name must be less than 200 characters'
      );
    });

    it('should truncate a default name if pathname is greater than 200 characters', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        tests: ['xss'],
        target: {
          url: `https://subdomain.example.com/${randomBytes(200).toString(
            'hex'
          )}`
        }
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result).toMatchObject({
        name: expect.stringMatching(/^.{1,199}…$/)
      });
    });

    it('should handle broken access control test with string auth', () => {
      // arrange
      const testConfig = {
        name: 'broken_access_control' as const,
        options: {
          auth: 'auth-object-id'
        }
      };
      const settings: ScanSettingsOptions = {
        tests: [testConfig],
        target: { url: 'https://example.com' }
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result.tests).toEqual([testConfig]);
    });

    it('should handle broken access control test with tuple auth', () => {
      // arrange
      const testConfig = {
        name: 'broken_access_control' as const,
        options: {
          auth: ['key', 'value'] as [string, string]
        }
      };
      const settings: ScanSettingsOptions = {
        tests: [testConfig],
        target: { url: 'https://example.com' }
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result.tests).toEqual([testConfig]);
    });

    it('should deduplicate string tests', () => {
      // arrange
      const testName = 'xss';
      const settings: ScanSettingsOptions = {
        tests: [testName, testName],
        target: { url: 'https://example.com' }
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result.tests).toEqual([testName]);
    });

    it('should not deduplicate object tests', () => {
      // arrange
      const testConfig1 = {
        name: 'broken_access_control' as const,
        options: {
          auth: 'auth1'
        }
      };
      const testConfig2 = {
        name: 'broken_access_control' as const,
        options: {
          auth: 'auth2'
        }
      };
      const settings: ScanSettingsOptions = {
        tests: [testConfig1, testConfig2],
        target: { url: 'https://example.com' }
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result.tests).toEqual([testConfig1, testConfig2]);
    });

    it('should handle mixed string and object tests', () => {
      // arrange
      const testName = 'xss';
      const testConfig = {
        name: 'broken_access_control' as const,
        options: {
          auth: 'auth-object-id'
        }
      };
      const settings: ScanSettingsOptions = {
        tests: [testName, testConfig],
        target: { url: 'https://example.com' }
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result.tests).toEqual([testName, testConfig]);
    });
  });
});
