import { IssuesGroup } from '../models';
import { Issue, severityComparator } from '@secbox/scan';

export class IssuesGrouper {
  public static group(issues: Issue[]): IssuesGroup[] {
    const grouped = issues.reduce(
      (res: IssuesGroup[], issue: Issue): IssuesGroup[] => {
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
      },
      []
    );

    grouped.sort(this.groupComparator);

    return grouped;
  }

  public static groupComparator(a: IssuesGroup, b: IssuesGroup): number {
    const res = severityComparator(a.severity, b.severity);

    return res ? res : b.issues.length - a.issues.length;
  }
}
