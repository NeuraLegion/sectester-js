import { RepeaterFactory } from './RepeaterFactory';
import {
  HttpRequestRunner,
  RequestRunner,
  RequestRunnerOptions
} from '../request-runner';
import { Repeater } from './Repeater';
import { Configuration } from '@sectester/core';
import {
  anything,
  deepEqual,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';
import { DependencyContainer, Lifecycle } from 'tsyringe';

describe('RepeaterFactory', () => {
  const defaultOptions = {
    timeout: 30000,
    maxContentLength: 100,
    reuseConnection: false,
    allowedMimes: [
      'text/html',
      'text/plain',
      'text/css',
      'text/javascript',
      'text/markdown',
      'text/xml',
      'application/javascript',
      'application/x-javascript',
      'application/json',
      'application/xml',
      'application/x-www-form-urlencoded',
      'application/msgpack',
      'application/ld+json',
      'application/graphql'
    ]
  };

  const mockedContainer = mock<DependencyContainer>();
  const mockedChildContainer = mock<DependencyContainer>();
  const mockedConfiguration = mock<Configuration>();

  const configuration = instance(mockedConfiguration);

  beforeEach(() => {
    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));

    when(mockedConfiguration.loadCredentials()).thenResolve();

    when(mockedContainer.createChildContainer()).thenReturn(
      instance(mockedChildContainer)
    );
  });

  afterEach(() => {
    reset<DependencyContainer | Configuration>(
      mockedContainer,
      mockedChildContainer,
      mockedConfiguration
    );
  });

  describe('createRepeater', () => {
    it('should create repeater', async () => {
      // arrange
      const factory = new RepeaterFactory(configuration);

      // act
      await factory.createRepeater();

      // assert
      verify(mockedChildContainer.resolve(Repeater)).once();
    });

    it('should register custom request runner options', async () => {
      // arrange
      const factory = new RepeaterFactory(configuration);
      when(
        mockedChildContainer.register(RequestRunnerOptions, anything())
      ).thenReturn();

      const requestRunnerOptions = {
        timeout: 10000,
        maxContentLength: 200,
        allowedMimes: ['text/html']
      };

      // act
      await factory.createRepeater({
        namePrefix: 'foo',
        description: 'description',
        requestRunnerOptions
      });

      // assert
      verify(
        mockedChildContainer.register(
          RequestRunnerOptions,
          objectContaining({
            useValue: requestRunnerOptions
          })
        )
      ).once();
    });

    it('should register request runner options', async () => {
      // arrange
      const factory = new RepeaterFactory(configuration);
      when(
        mockedChildContainer.register(RequestRunnerOptions, anything())
      ).thenReturn();

      // act
      await factory.createRepeater({ requestRunnerOptions: defaultOptions });

      // assert
      verify(
        mockedChildContainer.register(
          RequestRunnerOptions,
          deepEqual({
            useValue: defaultOptions
          })
        )
      ).once();
    });

    it('should register request runners', async () => {
      // arrange
      const factory = new RepeaterFactory(configuration);

      // act
      await factory.createRepeater({
        requestRunners: [HttpRequestRunner]
      });

      // assert
      verify(
        mockedChildContainer.register(
          RequestRunner,
          deepEqual({
            useClass: HttpRequestRunner
          }),
          deepEqual({
            lifecycle: Lifecycle.ContainerScoped
          })
        )
      ).once();
    });
  });
});
