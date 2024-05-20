import { RepeaterFactory } from './RepeaterFactory';
import { RepeaterBus } from '../bus/RepeaterBus';
import { RepeaterBusFactory } from '../bus/RepeaterBusFactory';
import {
  HttpRequestRunner,
  RequestRunner,
  RequestRunnerOptions
} from '../request-runner';
import { Repeater } from './Repeater';
import { RepeatersManager } from '../api';
import { Configuration } from '@sectester/core';
import {
  anything,
  capture,
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
  const repeaterId = 'fooId';
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
  const mockedRepeaterBus = mock<RepeaterBus>();
  const mockedRepeaterManager = mock<RepeatersManager>();
  const mockedRepeaterBusFactory = mock<RepeaterBusFactory>();

  const configuration = instance(mockedConfiguration);

  beforeEach(() => {
    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));

    when(mockedConfiguration.loadCredentials()).thenResolve();

    when(mockedContainer.createChildContainer()).thenReturn(
      instance(mockedChildContainer)
    );

    when(
      mockedContainer.resolve<RepeatersManager>(RepeatersManager)
    ).thenReturn(instance(mockedRepeaterManager));

    when(mockedRepeaterManager.createRepeater(anything())).thenResolve({
      repeaterId
    });

    when(
      mockedChildContainer.resolve<RepeaterBusFactory>(RepeaterBusFactory)
    ).thenReturn(instance(mockedRepeaterBusFactory));

    when(mockedRepeaterBusFactory.create(repeaterId)).thenReturn(
      instance(mockedRepeaterBus)
    );
  });

  afterEach(() => {
    reset<
      | DependencyContainer
      | Configuration
      | RepeaterBus
      | RepeatersManager
      | RepeaterBusFactory
    >(
      mockedContainer,
      mockedChildContainer,
      mockedConfiguration,
      mockedRepeaterBus,
      mockedRepeaterBusFactory,
      mockedRepeaterManager
    );
  });

  describe('createRepeater', () => {
    it('should create repeater', async () => {
      // arrange
      const factory = new RepeaterFactory(configuration);

      // act
      const res = await factory.createRepeater();

      // assert
      expect(res).toBeInstanceOf(Repeater);
      expect(res).toMatchObject({
        repeaterId
      });
    });

    it('should create repeater with given name prefix and description', async () => {
      // arrange
      const factory = new RepeaterFactory(configuration);

      // act
      const res = await factory.createRepeater({
        namePrefix: 'foo',
        description: 'description'
      });

      const [arg]: [
        {
          name: string;
          description?: string;
        }
      ] = capture<{
        name: string;
        description?: string;
      }>(mockedRepeaterManager.createRepeater).first();

      // assert
      expect(arg?.name).toMatch(/^foo/);
      expect(arg?.description).toBe('description');
      expect(res).toBeInstanceOf(Repeater);
    });

    it('should create repeater with given name without the random postfix', async () => {
      // arrange
      const factory = new RepeaterFactory(configuration);

      // act
      const res = await factory.createRepeater({
        namePrefix: 'foo',
        disableRandomNameGeneration: true
      });

      // assert
      verify(
        mockedRepeaterManager.createRepeater(objectContaining({ name: 'foo' }))
      );
      expect(res).toBeInstanceOf(Repeater);
    });

    it('should create repeater with given project', async () => {
      // arrange
      const factory = new RepeaterFactory(configuration);
      const projectId = '321';
      const res = await factory.createRepeater({
        projectId
      });

      verify(
        mockedRepeaterManager.createRepeater(objectContaining({ projectId }))
      );
      expect(res).toBeInstanceOf(Repeater);
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

    it('should throw an error if name prefix is too long', async () => {
      // arrange
      const factory = new RepeaterFactory(configuration);

      // act
      const res = factory.createRepeater({
        namePrefix: 'foo'.repeat(50)
      });

      // assert
      await expect(res).rejects.toThrow(
        'Name prefix must be less than or equal to 43 characters.'
      );
    });

    it('should throw an error when name prefix is too long and random postfix is disabled', async () => {
      // arrange
      const factory = new RepeaterFactory(configuration);

      // act
      const res = factory.createRepeater({
        namePrefix: 'foo'.repeat(80),
        disableRandomNameGeneration: true
      });

      // assert
      await expect(res).rejects.toThrow(
        'Name prefix must be less than or equal to 80 characters.'
      );
    });
  });
});
