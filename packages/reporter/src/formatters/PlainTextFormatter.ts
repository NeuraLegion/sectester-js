import { Formatter } from '../lib';
import { Comment, Issue } from '@sectester/scan';
import { format } from 'util';

export class PlainTextFormatter implements Formatter {
  private readonly BULLET_POINT = '●';
  private readonly NEW_LINE = '\n';
  private readonly TABULATION = '\t';

  public format(issue: Issue): string {
    const {
      link,
      name,
      severity,
      remedy,
      details,
      comments = [],
      resources = []
    } = issue;
    const template = this.generateTemplate({
      extraInfo: comments.length > 0,
      references: resources.length > 0
    });

    const message = format(
      template,
      link,
      name,
      severity,
      remedy,
      details,
      this.formatList(comments, comment => this.formatExtraInfo(comment)),
      this.formatList(resources)
    );

    return message.trim();
  }

  private generateTemplate(options: {
    extraInfo: boolean;
    references: boolean;
  }): string {
    return `
Issue in Bright UI:   %s
Name:                 %s
Severity:             %s
Remediation:
%s
Details:
%s${options.extraInfo ? `\nExtra Details:\n%s` : ''}${
      options.references ? `\nReferences:\n%s` : ''
    }`.trim();
  }

  private formatExtraInfo({ headline, text = '', links = [] }: Comment) {
    const footer = links.length
      ? this.combineList(['Links:', this.formatList(links)])
      : '';
    const blocks = [text, footer].map(x => this.indent(x));
    const document = this.combineList(blocks);

    return this.combineList([headline, document]);
  }

  private indent(x: string, length: number = 1) {
    const lines = x.split(this.NEW_LINE);

    return this.combineList(
      lines.map(line => `${this.TABULATION.repeat(length)}${line}`)
    );
  }

  private formatList<T>(list: T[], map?: (x: T) => string): string {
    const items = list.map(
      x => `${this.BULLET_POINT} ${typeof map == 'function' ? map(x) : x}`
    );

    return this.combineList(items);
  }

  private combineList(list: string[], sep?: string): string {
    return list.join(sep ?? this.NEW_LINE);
  }
}
