import { CognitoIdentityProvider, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Resource } from 'sst';
import { Email } from './email.js';

export class Users {
  static #cognitoIdp: CognitoIdentityProvider | null = null;

  static cognitoIdp(): CognitoIdentityProvider {
    if (!Users.#cognitoIdp) {
      Users.#cognitoIdp = new CognitoIdentityProvider();
    }
    return Users.#cognitoIdp;
  }

  static async createAdminUser(email: string) {
    await Users.cognitoIdp().send(
      new AdminCreateUserCommand({
        Username: email,
        UserPoolId: Resource.UserPoolLink.userPoolId,
      }),
    );
    await Email.addAdminEmail(email);
  }
}
