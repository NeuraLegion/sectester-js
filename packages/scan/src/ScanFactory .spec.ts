import 'reflect-metadata';
import { Scans } from './Scans';
import { ScanFactory } from './ScanFactory ';
import { TestType } from './enums';
import { anything, instance, mock, reset, when } from 'ts-mockito';

describe('ScanFactory', () => {
  const mockedScans = mock<Scans>();
  let scanFactory!: ScanFactory;

  beforeEach(() => {
    scanFactory = new ScanFactory(instance(mockedScans));
  });

  afterEach(() => reset<Scans>(mockedScans));

  describe('createScan', () => {
    it('should create Scan', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      when(mockedScans.create(anything())).thenResolve({ id });

      const result = await scanFactory.createScan({
        name: 'test',
        target: { url: 'https://example.com' },
        tests: [TestType.ANGULAR_CSTI]
      });

      expect(result).toMatchObject({ id });
    });
  });
});
