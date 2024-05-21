import { DefaultRepeaterBusFactory } from './DefaultRepeaterBusFactory';
import { RepeaterServer } from './RepeaterServer';
import { RepeaterCommandHub } from './RepeaterCommandHub';
import { DefaultRepeaterBus } from './DefaultRepeaterBus';
import { Configuration, Logger } from '@sectester/core';
import { instance, mock, reset } from 'ts-mockito';

describe('DefaultRepeaterBusFactory', () => {
  const repeaterId = 'fooId';

  const mockedLogger = mock<Logger>();
  const mockedConfiguration = mock<Configuration>();
  const mockedRepeaterServer = mock<RepeaterServer>();
  const mockedRepeaterCommandHub = mock<RepeaterCommandHub>();

  const configuration = instance(mockedConfiguration);

  let sut!: DefaultRepeaterBusFactory;

  beforeEach(() => {
    sut = new DefaultRepeaterBusFactory(
      instance(mockedLogger),
      configuration,
      instance(mockedRepeaterServer),
      instance(mockedRepeaterCommandHub)
    );
  });

  afterEach(() => {
    reset<Logger | Configuration | RepeaterServer | RepeaterCommandHub>(
      mockedLogger,
      mockedConfiguration,
      mockedRepeaterServer,
      mockedRepeaterCommandHub
    );
  });

  describe('create', () => {
    it('should create', () => {
      // act
      const res = sut.create(repeaterId);

      // assert
      expect(res).toBeInstanceOf(DefaultRepeaterBus);
    });
  });
});
