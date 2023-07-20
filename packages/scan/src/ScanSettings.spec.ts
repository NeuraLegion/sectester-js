import { AttackParamLocation, TestType } from './models';
import { ScanSettings, ScanSettingsOptions } from './ScanSettings';
import { randomBytes } from 'crypto';

describe('ScanSettings', () => {
  describe('constructor', () => {
    it.each([
      {
        input: { tests: ['xxx' as unknown as TestType] },
        expected: 'Unknown test type supplied'
      },
      { input: { tests: [] }, expected: 'Please provide a least one test' },
      {
        input: {
          attackParamLocations: ['xxx' as AttackParamLocation]
        },
        expected: 'Unknown attack param location supplied'
      },
      {
        input: {
          attackParamLocations: []
        },
        expected: 'Please provide a least one attack parameter location'
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
          slowEpTimeout: 1
        },
        expected: 'Invalid slow entry point timeout'
      },
      {
        input: {
          targetTimeout: 0
        },
        expected: 'Invalid target connection timeout'
      },
      {
        input: {
          targetTimeout: 121
        },
        expected: 'Invalid target connection timeout'
      }
    ])(
      'should raise the error `$expected` when invalid config ($input) is supplied',
      ({ input, expected }) => {
        // arrange
        const settings: ScanSettingsOptions = {
          target: { url: 'https://example.com' },
          tests: [TestType.XPATHI],
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
        tests: [TestType.XPATHI],
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

    it('should create a settings with unique tests', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        target: { url: 'https://example.com' },
        tests: [TestType.XPATHI, TestType.XPATHI]
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result).toMatchObject({
        tests: [TestType.XPATHI]
      });
    });

    it('should create a settings with custom name', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        name: 'my scan',
        tests: [TestType.STORED_XSS],
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
        tests: [TestType.STORED_XSS],
        target: { url: 'https://example.com' }
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result).toMatchObject({
        name: 'GET example.com'
      });
    });

    it('should throw an error if name is greater than 200 characters', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        name: randomBytes(201).toString('hex'),
        tests: [TestType.STORED_XSS],
        target: { url: 'https://example.com' }
      };

      // act & assert
      expect(() => new ScanSettings(settings)).toThrow(
        'Name must be less than 200 characters'
      );
    });

    it('should truncate a default name if hostname is greater than 200 characters', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        tests: [TestType.STORED_XSS],
        target: {
          url: `https://subdomain-${randomBytes(200).toString(
            'hex'
          )}.example.com`
        }
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result).toMatchObject({
        name: expect.stringMatching(/^.{1,200}$/)
      });
    });
  });
});
