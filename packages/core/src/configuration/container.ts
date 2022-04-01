import { CredentialProvider } from '.';
import { EnvCredentialProvider } from './DefaultCredentialProvider';
import { container, Lifecycle } from 'tsyringe';

container
  .register('tsyringe', { useValue: container })
  .register(
    CredentialProvider,
    { useClass: EnvCredentialProvider },
    { lifecycle: Lifecycle.Singleton }
  );

export default container;
