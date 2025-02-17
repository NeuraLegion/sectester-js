import 'reflect-metadata';
import { GITHUB_CONFIG } from './GitHubConfig';
import { container } from 'tsyringe';
import { reset, spy, when } from 'ts-mockito';

describe('GitHub Register', () => {
  const processEnv = process.env;
  let processSpy!: NodeJS.Process;

  beforeEach(() => {
    processSpy = spy(process);
  });

  afterEach(() => {
    reset(processSpy);
    jest.resetModules();
  });

  it('should register config for check_suite event', async () => {
    when(processSpy.env).thenReturn({
      ...processEnv,
      GITHUB_EVENT_PATH: '/tmp/event.json',
      GITHUB_EVENT_NAME: 'check_suite',
      GITHUB_TOKEN: 'mock-token',
      GITHUB_REPOSITORY: 'owner/repo'
    });

    jest.mock(
      '/tmp/event.json',
      () => ({
        check_suite: { head_sha: 'test-sha' }
      }),
      { virtual: true }
    );

    await import('./register');

    const config = container.resolve(GITHUB_CONFIG);
    expect(config).toEqual({
      commitSha: 'test-sha',
      token: 'mock-token',
      repository: 'owner/repo'
    });
  });

  it('should register config for check_run event', async () => {
    when(processSpy.env).thenReturn({
      ...processEnv,
      GITHUB_EVENT_PATH: '/tmp/event.json',
      GITHUB_EVENT_NAME: 'check_run',
      GITHUB_TOKEN: 'mock-token',
      GITHUB_REPOSITORY: 'owner/repo'
    });

    jest.mock(
      '/tmp/event.json',
      () => ({
        check_run: {
          check_suite: { head_sha: 'test-sha' }
        }
      }),
      { virtual: true }
    );

    await import('./register');

    const config = container.resolve(GITHUB_CONFIG);
    expect(config).toEqual({
      commitSha: 'test-sha',
      token: 'mock-token',
      repository: 'owner/repo'
    });
  });

  it('should register config for pull_request event', async () => {
    when(processSpy.env).thenReturn({
      ...processEnv,
      GITHUB_EVENT_PATH: '/tmp/event.json',
      GITHUB_EVENT_NAME: 'pull_request',
      GITHUB_TOKEN: 'mock-token',
      GITHUB_REPOSITORY: 'owner/repo'
    });

    jest.mock(
      '/tmp/event.json',
      () => ({
        pull_request: {
          head: { sha: 'test-sha' }
        }
      }),
      { virtual: true }
    );

    await import('./register');

    const config = container.resolve(GITHUB_CONFIG);
    expect(config).toEqual({
      commitSha: 'test-sha',
      token: 'mock-token',
      repository: 'owner/repo'
    });
  });

  it('should throw error for unsupported event', async () => {
    when(processSpy.env).thenReturn({
      ...processEnv,
      GITHUB_EVENT_PATH: '/tmp/event.json',
      GITHUB_EVENT_NAME: 'unsupported'
    });

    jest.mock(
      '/tmp/event.json',
      () => ({
        unsupported: {}
      }),
      { virtual: true }
    );

    await expect(import('./register')).rejects.toThrow(
      'No pull-request and commit data available for the request.'
    );
  });
});
