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
      }
    ])(
      'should raise the error `$expected` when invalid config ($input) is supplied',
      ({ input, expected }) => {
        // arrange
        const settings: ScanSettingsOptions = {
          target: { url: 'https://example.com' },
          tests: [TestType.XPATH_INJECTION],
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
        tests: [TestType.XPATH_INJECTION],
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
        tests: [TestType.XPATH_INJECTION, TestType.XPATH_INJECTION]
      };

      // act
      const result = new ScanSettings(settings);

      // assert
      expect(result).toMatchObject({
        tests: [TestType.XPATH_INJECTION]
      });
    });

    it('should create a settings with custom name', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        name: 'my scan',
        tests: [TestType.CROSS_SITE_SCRIPTING],
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
        tests: [TestType.CROSS_SITE_SCRIPTING],
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
        tests: [TestType.CROSS_SITE_SCRIPTING],
        target: { url: 'https://example.com/users/1' }
      };

      // act & assert
      expect(() => new ScanSettings(settings)).toThrow(
        'Name must be less than 200 characters'
      );
    });

    it('should truncate a default name if hostname is greater than 200 characters', () => {
      // arrange
      const settings: ScanSettingsOptions = {
        tests: [TestType.CROSS_SITE_SCRIPTING],
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
