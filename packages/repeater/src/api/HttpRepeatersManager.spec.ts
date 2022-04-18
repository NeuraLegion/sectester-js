import 'reflect-metadata';
import {
  CreateRepeaterRequest,
  DeleteRepeaterRequest,
  ListRepeatersRequest
} from './commands';
import { HttpRepeatersManager } from './HttpRepeatersManager';
import { RepeatersManager } from './RepeatersManager';
import { CommandDispatcher } from '@secbox/core';
import { anyOfClass, instance, mock, reset, verify, when } from 'ts-mockito';
import { HttpCommandDispatcher } from '@secbox/bus';

describe('HttpRepeatersManager', () => {
  const MockedCommandDispatcher = mock<CommandDispatcher>(
    HttpCommandDispatcher
  );
  let manager!: RepeatersManager;

  beforeEach(() => {
    manager = new HttpRepeatersManager(instance(MockedCommandDispatcher));
  });

  afterEach(() => {
    reset(MockedCommandDispatcher);
  });

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
    verify(
      MockedCommandDispatcher.execute(anyOfClass(ListRepeatersRequest))
    ).once();
    expect(result.repeaterId).toBe('42');
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

  it('should remove repeater', async () => {
    when(
      MockedCommandDispatcher.execute(anyOfClass(DeleteRepeaterRequest))
    ).thenResolve();

    const res = manager.deleteRepeater('fooId');

    verify(
      MockedCommandDispatcher.execute(anyOfClass(DeleteRepeaterRequest))
    ).once();
    await expect(res).resolves.not.toThrow();
  });
});
