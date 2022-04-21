import 'reflect-metadata';
import {
  CreateRepeaterRequest,
  DeleteRepeaterRequest,
  ListRepeatersRequest
} from './commands';
import { DefaultRepeatersManager } from './DefaultRepeatersManager';
import { RepeatersManager } from './RepeatersManager';
import { CommandDispatcher } from '@secbox/core';
import { anyOfClass, instance, mock, reset, verify, when } from 'ts-mockito';

describe('DefaultRepeatersManager', () => {
  const MockedCommandDispatcher = mock<CommandDispatcher>();
  let manager!: RepeatersManager;

  beforeEach(() => {
    manager = new DefaultRepeatersManager(instance(MockedCommandDispatcher));
  });

  afterEach(() => reset(MockedCommandDispatcher));

  describe('createRepeater', () => {
    it('should create repeater', async () => {
      when(
        MockedCommandDispatcher.execute(anyOfClass(CreateRepeaterRequest))
      ).thenResolve();

      when(
        MockedCommandDispatcher.execute(anyOfClass(ListRepeatersRequest))
      ).thenResolve([
        { name: 'bar', id: '142' },
        {
          name: 'foo',
          id: '42'
        }
      ]);

      const result = await manager.createRepeater({ name: 'foo' });

      verify(
        MockedCommandDispatcher.execute(anyOfClass(CreateRepeaterRequest))
      ).once();
      expect(result).toMatchObject({ repeaterId: '42' });
    });

    it('should throw an error if cannot find created repeater', async () => {
      when(
        MockedCommandDispatcher.execute(anyOfClass(CreateRepeaterRequest))
      ).thenResolve();
      when(
        MockedCommandDispatcher.execute(anyOfClass(ListRepeatersRequest))
      ).thenResolve(null);

      const res = manager.createRepeater({ name: 'foo' });

      await expect(res).rejects.toThrow('Cannot find created repeater id');
    });
  });

  describe('deleteRepeater', () => {
    it('should remove repeater', async () => {
      when(
        MockedCommandDispatcher.execute(anyOfClass(DeleteRepeaterRequest))
      ).thenResolve();

      await manager.deleteRepeater('fooId');

      verify(
        MockedCommandDispatcher.execute(anyOfClass(DeleteRepeaterRequest))
      ).once();
    });
  });
});
