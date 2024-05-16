import 'reflect-metadata';
import { RepeaterFactory } from './RepeaterFactory';
import {
  HttpRequestRunner,
  RequestRunner,
  RequestRunnerOptions
} from '../request-runner';
import { Repeater } from './Repeater';
import { RepeatersManager } from '../api';
import { Configuration, EventBus } from '@sectester/core';
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

const resolvableInstance = <T extends object>(m: T): T =>
  new Proxy<T>(instance(m), {
    get(target, prop, receiver) {
      if (
        ['Symbol(Symbol.toPrimitive)', 'then', 'catch'].includes(
          prop.toString()
        )
      ) {
        return undefined;
      }

      return Reflect.get(target, prop, receiver);
    }
  });

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
  const mockedEventBus = mock<EventBus>();
  const mockedRepeaterManager = mock<RepeatersManager>();

  const configuration = instance(mockedConfiguration);

  beforeEach(() => {
    when(mockedChildContainer.resolve<EventBus>(EventBus)).thenReturn(
      resolvableInstance(mockedEventBus)
    );
    when(
      mockedContainer.resolve<RepeatersManager>(RepeatersManager)
    ).thenReturn(instance(mockedRepeaterManager));

    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));

    when(mockedContainer.createChildContainer()).thenReturn(
      instance(mockedChildContainer)
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    when(mockedEventBus.init!()).thenResolve();

    when(mockedRepeaterManager.createRepeater(anything())).thenResolve({
      repeaterId
    });
  });

  afterEach(() => {
    reset<DependencyContainer | Configuration | EventBus | RepeatersManager>(
      mockedContainer,
      mockedChildContainer,
      mockedConfiguration,
      mockedEventBus,
      mockedRepeaterManager
    );
  });

  describe('createRepeater', () => {
    it('should create repeater', async () => {
      const factory = new RepeaterFactory(configuration);

      const res = await factory.createRepeater();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      verify(mockedEventBus.init!()).once();
      expect(res).toBeInstanceOf(Repeater);
      expect(res).toMatchObject({
        repeaterId
      });
    });

    it('should create repeater with given name prefix and description', async () => {
      const factory = new RepeaterFactory(configuration);

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

      expect(arg?.name).toMatch(/^foo/);
      expect(arg?.description).toBe('description');
      expect(res).toBeInstanceOf(Repeater);
    });

    it('should create repeater with given name without the random postfix', async () => {
      const factory = new RepeaterFactory(configuration);

      const res = await factory.createRepeater({
        namePrefix: 'foo',
        disableRandomNameGeneration: true
      });

      verify(
        mockedRepeaterManager.createRepeater(objectContaining({ name: 'foo' }))
      );
      expect(res).toBeInstanceOf(Repeater);
    });

    it('should create repeater with given project', async () => {
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
      const factory = new RepeaterFactory(configuration);
      when(
        mockedChildContainer.register(RequestRunnerOptions, anything())
      ).thenReturn();

      const requestRunnerOptions = {
        timeout: 10000,
        maxContentLength: 200,
        allowedMimes: ['text/html']
      };

      await factory.createRepeater({
        namePrefix: 'foo',
        description: 'description',
        requestRunnerOptions
      });

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
      const factory = new RepeaterFactory(configuration);
      when(
        mockedChildContainer.register(RequestRunnerOptions, anything())
      ).thenReturn();

      await factory.createRepeater({ requestRunnerOptions: defaultOptions });

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
      const factory = new RepeaterFactory(configuration);

      await factory.createRepeater({
        requestRunners: [HttpRequestRunner]
      });

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
      const factory = new RepeaterFactory(configuration);

      const res = factory.createRepeater({
        namePrefix: 'foo'.repeat(50)
      });

      await expect(res).rejects.toThrow(
        'Name prefix must be less than or equal to 43 characters.'
      );
    });

    it('should throw an error when name prefix is too long and random postfix is disabled', async () => {
      const factory = new RepeaterFactory(configuration);

      const res = factory.createRepeater({
        namePrefix: 'foo'.repeat(80),
        disableRandomNameGeneration: true
      });

      await expect(res).rejects.toThrow(
        'Name prefix must be less than or equal to 80 characters.'
      );
    });
  });

  describe('createRepeaterFromExisting', () => {
    it('should create repeater from existing repeater ID', async () => {
      const factory = new RepeaterFactory(configuration);
      const existingRepeaterId = '123';

      const res = await factory.createRepeaterFromExisting(existingRepeaterId);

      expect(res).toBeInstanceOf(Repeater);
      expect(res).toMatchObject({
        repeaterId: existingRepeaterId
      });
    });

    it('should register custom request runner options', async () => {
      const factory = new RepeaterFactory(configuration);
      const existingRepeaterId = '123';
      when(
        mockedChildContainer.register(RequestRunnerOptions, anything())
      ).thenReturn();

      const requestRunnerOptions = {
        timeout: 10000,
        maxContentLength: 200,
        allowedMimes: ['text/html']
      };

      await factory.createRepeaterFromExisting(existingRepeaterId, {
        requestRunnerOptions
      });

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
      const factory = new RepeaterFactory(configuration);
      const existingRepeaterId = '123';

      await factory.createRepeaterFromExisting(existingRepeaterId, {
        requestRunnerOptions: defaultOptions
      });

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
      const factory = new RepeaterFactory(configuration);
      const existingRepeaterId = '123';

      await factory.createRepeaterFromExisting(existingRepeaterId, {
        requestRunners: [HttpRequestRunner]
      });

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
