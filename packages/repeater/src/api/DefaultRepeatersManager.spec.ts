import 'reflect-metadata';
import {
  CreateRepeaterRequest,
  DeleteRepeaterRequest,
  GetRepeaterRequest
} from './commands';
import { DefaultRepeatersManager } from './DefaultRepeatersManager';
import { RepeatersManager } from './RepeatersManager';
import { CommandDispatcher } from '@sectester/core';
import {
  anyOfClass,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';

describe('DefaultRepeatersManager', () => {
  const mockedCommandDispatcher = mock<CommandDispatcher>();
  let manager!: RepeatersManager;

  beforeEach(() => {
    manager = new DefaultRepeatersManager(instance(mockedCommandDispatcher));
  });

  afterEach(() => reset(mockedCommandDispatcher));

  describe('createRepeater', () => {
    it('should create repeater', async () => {
      when(
        mockedCommandDispatcher.execute(anyOfClass(CreateRepeaterRequest))
      ).thenResolve({ id: '142' });

      const result = await manager.createRepeater({ name: 'foo' });

      verify(
        mockedCommandDispatcher.execute(anyOfClass(CreateRepeaterRequest))
      ).once();
      expect(result).toMatchObject({ repeaterId: '142' });
    });

    it('should create repeater under a specific project', async () => {
      when(
        mockedCommandDispatcher.execute(
          objectContaining({ payload: { name: 'foo', projectIds: ['321'] } })
        )
      ).thenResolve({ id: '142' });

      const result = await manager.createRepeater({
        name: 'foo',
        projectId: '321'
      });

      expect(result).toMatchObject({ repeaterId: '142' });
    });

    it('should throw an error if cannot find created repeater', async () => {
      when(
        mockedCommandDispatcher.execute(anyOfClass(CreateRepeaterRequest))
      ).thenResolve();

      const res = manager.createRepeater({ name: 'foo' });

      await expect(res).rejects.toThrow('Cannot create a new repeater');
    });
  });

  describe('getRepeater', () => {
    it('should return repeater', async () => {
      const repeaterId = '142';
      when(
        mockedCommandDispatcher.execute(anyOfClass(GetRepeaterRequest))
      ).thenResolve({ id: repeaterId });

      const result = await manager.getRepeater(repeaterId);

      verify(
        mockedCommandDispatcher.execute(anyOfClass(GetRepeaterRequest))
      ).once();
      expect(result).toMatchObject({ repeaterId });
    });

    it('should throw an error if cannot find repeater', async () => {
      when(
        mockedCommandDispatcher.execute(anyOfClass(GetRepeaterRequest))
      ).thenResolve();

      const act = manager.getRepeater('123');

      await expect(act).rejects.toThrow('Cannot find repeater');
    });
  });

  describe('deleteRepeater', () => {
    it('should remove repeater', async () => {
      when(
        mockedCommandDispatcher.execute(anyOfClass(DeleteRepeaterRequest))
      ).thenResolve();

      await manager.deleteRepeater('fooId');

      verify(
        mockedCommandDispatcher.execute(anyOfClass(DeleteRepeaterRequest))
      ).once();
    });
  });
});
