import 'reflect-metadata';
import { DefaultRepeatersManager } from './DefaultRepeatersManager';
import { RepeatersManager } from './RepeatersManager';
import { ApiError, ApiClient } from '@sectester/core';
import { instance, mock, reset, when, deepEqual } from 'ts-mockito';

describe('DefaultRepeatersManager', () => {
  const mockedApiClient = mock<ApiClient>();
  let manager: RepeatersManager;

  beforeEach(() => {
    manager = new DefaultRepeatersManager(instance(mockedApiClient));
  });

  afterEach(() => reset(mockedApiClient));

  describe('createRepeater', () => {
    it('should create repeater', async () => {
      const response = new Response(JSON.stringify({ id: '142' }));
      when(
        mockedApiClient.request(
          '/api/v1/repeaters',
          deepEqual<RequestInit>({
            method: 'POST',
            body: JSON.stringify({ name: 'foo' })
          })
        )
      ).thenResolve(response);

      const result = await manager.createRepeater({ name: 'foo' });

      expect(result).toMatchObject({ repeaterId: '142' });
    });

    it('should create repeater under a specific project', async () => {
      const response = new Response(JSON.stringify({ id: '142' }));
      when(
        mockedApiClient.request(
          '/api/v1/repeaters',
          deepEqual<RequestInit>({
            method: 'POST',
            body: JSON.stringify({ name: 'foo', projectIds: ['321'] })
          })
        )
      ).thenResolve(response);

      const result = await manager.createRepeater({
        name: 'foo',
        projectId: '321'
      });

      expect(result).toMatchObject({ repeaterId: '142' });
    });

    it('should throw an error if cannot find created repeater', async () => {
      const err = new ApiError(
        new Response('Repeater not found', { status: 404 })
      );
      when(
        mockedApiClient.request(
          '/api/v1/repeaters',
          deepEqual<RequestInit>({
            method: 'POST',
            body: JSON.stringify({ name: 'foo' })
          })
        )
      ).thenReject(err);

      const res = manager.createRepeater({ name: 'foo' });

      await expect(res).rejects.toThrow('Cannot create a new repeater');
    });
  });

  describe('getRepeater', () => {
    it('should return repeater', async () => {
      const repeaterId = '142';
      const response = new Response(JSON.stringify({ id: repeaterId }));
      when(
        mockedApiClient.request(`/api/v1/repeaters/${repeaterId}`)
      ).thenResolve(response);

      const result = await manager.getRepeater(repeaterId);

      expect(result).toMatchObject({ repeaterId });
    });

    it('should throw an error if cannot find repeater', async () => {
      const err = new ApiError(
        new Response('Repeater not found', { status: 404 })
      );
      when(mockedApiClient.request('/api/v1/repeaters/123')).thenReject(err);

      const act = manager.getRepeater('123');

      await expect(act).rejects.toThrow('Cannot find repeater');
    });
  });

  describe('deleteRepeater', () => {
    it('should remove repeater', async () => {
      const response = new Response(null, { status: 204 });
      when(
        mockedApiClient.request(
          '/api/v1/repeaters/fooId',
          deepEqual<RequestInit>({
            method: 'DELETE'
          })
        )
      ).thenResolve(response);

      const act = manager.deleteRepeater('fooId');

      await expect(act).resolves.not.toThrow();
    });
  });
});
