import 'reflect-metadata';
import { PlainTextFormatter } from './PlainTextFormatter';
import {
  fullyDescribedIssue,
  fullyDescribedIssueText,
  issueWithoutExtraInfo,
  issueWithoutExtraInfoText,
  issueWithoutResources,
  issueWithoutResourcesText
} from '../__fixtures__/issues';
import { Issue } from '@sectester/scan';

describe('PlainTextFormatter', () => {
  let formatter!: PlainTextFormatter;

  beforeEach(() => {
    formatter = new PlainTextFormatter();
  });

  describe('format', () => {
    it.each([
      {
        input: fullyDescribedIssue,
        expected: fullyDescribedIssueText,
        title: 'fully described issue'
      },
      {
        input: issueWithoutExtraInfo,
        expected: issueWithoutExtraInfoText,
        title: 'issue without extra info'
      },
      {
        input: issueWithoutResources,
        expected: issueWithoutResourcesText,
        title: 'issue without resources'
      }
    ])('should format $title', ({ input, expected }) => {
      // act
      const result = formatter.format(input as Issue);

      // assert
      expect(result).toEqual(expected);
    });
  });
});
