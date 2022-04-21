import { Issue, IssuesGroup } from '../models';

export class IssuesGrouper {
  public static group(issues: Issue[]): IssuesGroup[] {
    return issues.reduce((res: IssuesGroup[], issue: Issue): IssuesGroup[] => {
      const issuesGroup: IssuesGroup | undefined = res.find(
        (group: IssuesGroup) =>
          group.severity === issue.severity && group.name === issue.name
      );
      if (issuesGroup) {
        issuesGroup.issues.push(issue);
      } else {
        res.push({
          severity: issue.severity,
          name: issue.name,
          issues: [issue]
        });
      }

      return res;
    }, []);
  }
}
