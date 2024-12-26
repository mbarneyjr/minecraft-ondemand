import { Resource } from 'sst';

type Config = {
  rootDomainName: string;
};

let config: Config;
try {
  config = {
    rootDomainName: Resource.Config.rootDomainName,
  };
} catch (e) {
  config = {
    rootDomainName: 'mc.mbarney.me',
  };
}

export { config };