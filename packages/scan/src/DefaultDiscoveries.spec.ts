import 'reflect-metadata';
import { DefaultDiscoveries } from './DefaultDiscoveries';
import { HttpMethod } from './models';
import { Target } from './target';
import { deepEqual, instance, mock, reset, when } from 'ts-mockito';
import { ApiClient, Configuration } from '@sectester/core';
import { randomUUID } from 'crypto';

describe('DefaultDiscoveries', () => {
  const entryPointId = randomUUID();
  const projectId = randomUUID();
  const repeaterId = randomUUID();

  const mockedApiClient = mock<ApiClient>();
  const mockedConfiguration = mock<Configuration>();
  let discoveries!: DefaultDiscoveries;

  const testTarget = new Target({
    method: HttpMethod.POST,
    url: 'https://example.com/api',
    headers: {
      'content-type': 'application/json',
      'x-custom-header': 'value'
    },
    body: { key: 'value' }
  });

  beforeEach(() => {
    discoveries = new DefaultDiscoveries(
      instance(mockedConfiguration),
      instance(mockedApiClient)
    );
    when(mockedConfiguration.projectId).thenReturn(projectId);
  });

  afterEach(() =>
    reset<ApiClient | Configuration>(mockedApiClient, mockedConfiguration)
  );

  describe('createEntrypoint', () => {
    it('should create a new entry point', async () => {
      const response = new Response(JSON.stringify({ id: entryPointId }));
      when(
        mockedApiClient.request(
          `/api/v2/projects/${projectId}/entry-points`,
          deepEqual({
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: testTarget.postData?.text
              }
            })
          })
        )
      ).thenResolve(response);

      const result = await discoveries.createEntrypoint(testTarget, repeaterId);

      expect(result).toEqual({ id: entryPointId });
    });

    it('should handle 409 conflict with location header redirect', async () => {
      const redirectLocation = `/api/v2/projects/${projectId}/entry-points/${entryPointId}`;
      const conflictResponse = new Response(null, {
        status: 409,
        headers: { location: redirectLocation }
      });
      const finalResponse = new Response(JSON.stringify({ id: entryPointId }));

      when(
        mockedApiClient.request(
          `/api/v2/projects/${projectId}/entry-points`,
          deepEqual({
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: testTarget.postData?.text
              }
            })
          })
        )
      ).thenResolve(conflictResponse);

      when(mockedApiClient.request(redirectLocation)).thenResolve(
        finalResponse
      );

      const result = await discoveries.createEntrypoint(testTarget, repeaterId);

      expect(result).toEqual({ id: entryPointId });
    });

    it('should handle GET requests without postData', async () => {
      const getTarget = new Target({
        method: HttpMethod.GET,
        url: 'https://example.com/api',
        headers: {
          'x-custom-header': 'value'
        }
      });

      const response = new Response(JSON.stringify({ id: entryPointId }));
      when(
        mockedApiClient.request(
          `/api/v2/projects/${projectId}/entry-points`,
          deepEqual({
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              request: {
                method: getTarget.method,
                url: getTarget.url,
                headers: getTarget.headers,
                body: undefined
              }
            })
          })
        )
      ).thenResolve(response);

      const result = await discoveries.createEntrypoint(getTarget, repeaterId);

      expect(result).toEqual({ id: entryPointId });
    });
  });
});
