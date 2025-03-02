import { BodyConverter } from './BodyConverter';

export class URLSearchParamsConverter
  implements BodyConverter<URLSearchParams>
{
  public canHandle(data: unknown): data is URLSearchParams {
    return data instanceof URLSearchParams;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async convert(data: URLSearchParams): Promise<string> {
    return data.toString();
  }

  public getMimeType(_data: URLSearchParams): string {
    return 'application/x-www-form-urlencoded';
  }
}
