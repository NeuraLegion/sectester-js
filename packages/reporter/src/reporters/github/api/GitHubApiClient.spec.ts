import 'reflect-metadata';
import { GitHubApiClient } from './GitHubApiClient';
import { CheckRunPayload, GitHubConfig } from '../types';
import nock from 'nock';

// TODO: enable once nock will be updated to support native fetch
describe.skip('GitHubApiClient', () => {
  let client: GitHubApiClient;
  const mockConfig: GitHubConfig = {
    token: 'test-token',
    repository: 'owner/repo',
    commitSha: 'abc123'
  };

  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  afterAll(() => nock.enableNetConnect());

  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate();
    }

    client = new GitHubApiClient(mockConfig);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.restore();
  });

  describe('createCheckRun', () => {
    const mockPayload: CheckRunPayload = {
      name: 'test-check',
      head_sha: mockConfig.commitSha,
      status: 'completed',
      conclusion: 'success',
      output: {
        title: 'Test Results',
        summary: 'All tests passed'
      }
    };

    it('should successfully create a check run', async () => {
      // Arrange
      const scope = nock('https://api.github.com')
        .post(`/repos/${mockConfig.repository}/check-runs`)
        .matchHeader('authorization', `Bearer ${mockConfig.token}`)
        .matchHeader('accept', 'application/vnd.github.v3+json')
        .matchHeader('content-type', 'application/json')
        .reply(201);

      // Act
      await client.createCheckRun(mockPayload);

      // Assert
      expect(scope.isDone()).toBe(true);
    });

    it('should throw error when API request fails', async () => {
      // Arrange
      const scope = nock('https://api.github.com')
        .post(`/repos/${mockConfig.repository}/check-runs`)
        .reply(401, {}, { statusText: 'Unauthorized' });

      // Act & Assert
      await expect(client.createCheckRun(mockPayload)).rejects.toThrow(
        'GitHub API error: 401 Unauthorized'
      );
      expect(scope.isDone()).toBe(true);
    });
  });
});
