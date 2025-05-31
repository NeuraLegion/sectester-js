import 'reflect-metadata';
import { DefaultDiscoveries } from './DefaultDiscoveries';
import { HttpMethod } from './models';
import { Target } from './target';
import { anyOfClass, deepEqual, instance, mock, reset, when } from 'ts-mockito';
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
            signal: anyOfClass(AbortSignal),
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(response);

      const result = await discoveries.createEntrypoint(testTarget, repeaterId);

      expect(result).toEqual({ id: entryPointId });
    });

    it('should handle 409 conflict by updating existing entry point with PUT', async () => {
      const redirectLocation = `/api/v2/projects/${projectId}/entry-points/${entryPointId}`;
      const conflictResponse = new Response(null, {
        status: 409,
        headers: { location: redirectLocation }
      });
      const putResponse = new Response(null, { status: 204 });
      const finalResponse = new Response(JSON.stringify({ id: entryPointId }));

      when(
        mockedApiClient.request(
          `/api/v2/projects/${projectId}/entry-points`,
          deepEqual({
            signal: anyOfClass(AbortSignal),
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(conflictResponse);

      when(
        mockedApiClient.request(
          redirectLocation,
          deepEqual({
            signal: anyOfClass(AbortSignal),
            method: 'PUT',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(putResponse);

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
            signal: anyOfClass(AbortSignal),
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: getTarget.auth,
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

    it('should get existing entry point even if PUT fails', async () => {
      const redirectLocation =
        'https://example.com/api/v2/projects/123/entry-points/456';
      const conflictResponse = new Response(null, {
        status: 409,
        headers: new Headers({ location: redirectLocation })
      });
      const putFailResponse = new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error'
      });

      when(
        mockedApiClient.request(
          `/api/v2/projects/${projectId}/entry-points`,
          deepEqual({
            signal: anyOfClass(AbortSignal),
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(conflictResponse);

      when(
        mockedApiClient.request(
          redirectLocation,
          deepEqual({
            signal: anyOfClass(AbortSignal),
            method: 'PUT',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(putFailResponse);

      const result = discoveries.createEntrypoint(testTarget, repeaterId);

      await expect(result).rejects.toThrow(
        `Failed to update existing entrypoint at ${redirectLocation}: Internal Server Error`
      );
    });

    it('should throw error when POST fails with non-409 status', async () => {
      const errorResponse = new Response('Bad Request', {
        status: 400,
        statusText: 'Bad Request'
      });

      when(
        mockedApiClient.request(
          `/api/v2/projects/${projectId}/entry-points`,
          deepEqual({
            signal: anyOfClass(AbortSignal),
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(errorResponse);

      const result = discoveries.createEntrypoint(testTarget, repeaterId);

      await expect(result).rejects.toThrow(
        'Failed to create entrypoint: Bad Request'
      );
    });

    it('should throw error when receiving 409 conflict without location header', async () => {
      const conflictResponse = new Response('Conflict', {
        status: 409,
        statusText: 'Conflict'
      });

      when(
        mockedApiClient.request(
          `/api/v2/projects/${projectId}/entry-points`,
          deepEqual({
            signal: anyOfClass(AbortSignal),
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(conflictResponse);

      const result = discoveries.createEntrypoint(testTarget, repeaterId);

      await expect(result).rejects.toThrow(
        'Failed to create entrypoint: Conflict'
      );
    });

    it('should throw error when GET request fails after successful PUT', async () => {
      const redirectLocation = `/api/v2/projects/${projectId}/entry-points/${entryPointId}`;
      const conflictResponse = new Response(null, {
        status: 409,
        headers: { location: redirectLocation }
      });
      const putResponse = new Response(null, { status: 204 });
      const getFailResponse = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found'
      });

      when(
        mockedApiClient.request(
          `/api/v2/projects/${projectId}/entry-points`,
          deepEqual({
            signal: anyOfClass(AbortSignal),
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(conflictResponse);

      when(
        mockedApiClient.request(
          redirectLocation,
          deepEqual({
            signal: anyOfClass(AbortSignal),
            method: 'PUT',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(putResponse);

      when(mockedApiClient.request(redirectLocation)).thenResolve(
        getFailResponse
      );

      const result = discoveries.createEntrypoint(testTarget, repeaterId);

      await expect(result).rejects.toThrow(
        'Failed to create entrypoint: Not Found'
      );
    });

    it('should throw error when 409 has location header but no location value', async () => {
      const headers = new Headers();
      headers.set('location', '');
      const conflictResponse = new Response('Conflict', {
        status: 409,
        statusText: 'Conflict',
        headers
      });

      when(
        mockedApiClient.request(
          `/api/v2/projects/${projectId}/entry-points`,
          deepEqual({
            signal: anyOfClass(AbortSignal),
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(conflictResponse);

      const putResponse = new Response(null, { status: 204 });
      when(
        mockedApiClient.request(
          '',
          deepEqual({
            signal: anyOfClass(AbortSignal),
            method: 'PUT',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              repeaterId,
              authObjectId: testTarget.auth,
              request: {
                method: testTarget.method,
                url: testTarget.url,
                headers: testTarget.headers,
                body: await testTarget.text()
              }
            })
          })
        )
      ).thenResolve(putResponse);

      const finalResponse = new Response(JSON.stringify({ id: entryPointId }));
      when(mockedApiClient.request('')).thenResolve(finalResponse);

      const result = await discoveries.createEntrypoint(testTarget, repeaterId);

      expect(result).toEqual({ id: entryPointId });
    });
  });
});
