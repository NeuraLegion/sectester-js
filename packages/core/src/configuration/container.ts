import { CredentialProvider } from '.';
import { DefaultCredentialProvider } from './DefaultCredentialProvider';
import { container, Lifecycle } from 'tsyringe';

container
  .register('tsyringe', { useValue: container })
  .register(
    CredentialProvider,
    { useClass: DefaultCredentialProvider },
    { lifecycle: Lifecycle.Singleton }
  );

export default container;
