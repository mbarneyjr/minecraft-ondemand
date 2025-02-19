import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { Resource } from 'sst';

type WhitelistEntry = {
  uuid: string;
  name: string;
};

type MojangUser = {
  id: string;
  name: string;
};

export class Whitelist {
  static async addUser(serviceName: string, username: string) {
    const whitelistPath = `${Resource.MountPathLink.path}/${serviceName}/whitelist.json`;
    const whitelistUsers = await Whitelist.listUsers(serviceName);
    if (!whitelistUsers.find((entry) => entry.name === username)) {
      const mojangUser = (await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`).then((r) =>
        r.json(),
      )) as MojangUser;
      whitelistUsers.push({ uuid: mojangUser.id, name: username });
      writeFileSync(whitelistPath, JSON.stringify(whitelistUsers, null, 2));
    }
  }

  static async removeUser(serviceName: string, username: string) {
    const whitelistPath = `${Resource.MountPathLink.path}/${serviceName}/whitelist.json`;
    const whitelistUsers = (await Whitelist.listUsers(serviceName)).filter((user) => user.name !== username);
    writeFileSync(whitelistPath, JSON.stringify(whitelistUsers, null, 2));
  }

  static listUsers(serviceName: string) {
    const whitelistPath = `${Resource.MountPathLink.path}/${serviceName}/whitelist.json`;
    const whitelist: Array<WhitelistEntry> = JSON.parse(readFileSync(whitelistPath, 'utf8'));
    return whitelist;
  }
}
