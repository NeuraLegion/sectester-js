# @secbox/repeater

Package to manage (i. e. create/destroy, start/stop) [repeaters](https://docs.brightsec.com/docs/on-premises-repeater-local-agent), which are mandatory for scanning targets on a local network.

Further it will be possible also edit initial requests using custom scripts and use self-signed certificates - similar to [NexPloit CLI](https://www.npmjs.com/package/@neuralegion/nexploit-cli).

### Expected usage in unit tests

```
import { RepeaterFactory, Repeater } from '@secbox/repeater';

describe('Scan', () => {
  let repeater: Repeater;

  beforeAll(async () => {
    let configuration;
    /* init configuration */

    repeater = await new RepeaterFactory(configuration).createRepeater();
    await repeater.start();
  });

  afterAll(async () => {
    await repeater.stop();
  });

  it('should ensure absense of some vulnerability', () => {
     /* run scan of local target passing `repeater.repeaterId` to scan config */
  });
});
```
