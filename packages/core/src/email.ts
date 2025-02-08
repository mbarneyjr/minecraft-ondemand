import { SES, SendEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, paginateQuery } from '@aws-sdk/lib-dynamodb';
import { Resource } from 'sst';

export class Email {
  static sesClient: SES | null = null;
  static ddbClient: DynamoDBDocument | null = null;

  static #sesClient(): SES {
    if (!Email.sesClient) {
      Email.sesClient = new SES({
        useDualstackEndpoint: true,
      });
    }
    return Email.sesClient;
  }

  static #dynamoClient(): DynamoDBDocument {
    if (!Email.ddbClient) {
      const endpoint = `https://dynamodb--us-east-2--amazonaws--com.${Resource.Ipv6Proxy.domainName}`;
      Email.ddbClient = DynamoDBDocument.from(
        new DynamoDB({
          endpoint,
        }),
      );
    }
    return Email.ddbClient;
  }

  static async sendEmail(options: { destinations: Array<string>; subject: string; body: string }) {
    const response = await this.#sesClient().send(
      new SendEmailCommand({
        Source: `no-reply@${Resource.Config.rootDomainName}`,
        Destination: {
          ToAddresses: options.destinations,
        },
        Message: {
          Subject: {
            Data: `Minecraft On-Demand: ${options.subject}`,
          },
          Body: {
            Html: {
              Data: options.body,
            },
          },
        },
      }),
    );
  }

  static async addAdminEmail(email: string) {
    await Email.#dynamoClient().put({
      TableName: Resource.EmailTable.name,
      Item: {
        pk: 'ADMIN_EMAIL',
        sk: email,
      },
    });
  }

  static async addUserEmail(email: string) {
    await Email.#dynamoClient().put({
      TableName: Resource.EmailTable.name,
      Item: {
        pk: 'USER_EMAIL',
        sk: email,
      },
    });
  }

  static async removeAdminEmail(email: string) {
    await Email.#dynamoClient().delete({
      TableName: Resource.EmailTable.name,
      Key: {
        pk: 'ADMIN_EMAIL',
        sk: email,
      },
    });
  }

  static async removeUserEmail(email: string) {
    await Email.#dynamoClient().delete({
      TableName: Resource.EmailTable.name,
      Key: {
        pk: 'USER_EMAIL',
        sk: email,
      },
    });
  }

  static async listAdminEmails(): Promise<Array<string>> {
    const paginator = paginateQuery(
      {
        client: Email.#dynamoClient(),
      },
      {
        TableName: Resource.EmailTable.name,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': 'pk',
        },
        ExpressionAttributeValues: {
          ':pk': 'ADMIN_EMAIL',
        },
      },
    );
    const emails: Array<string> = [];
    for await (const page of paginator) {
      for (const item of page?.Items ?? []) {
        emails.push(item.sk);
      }
    }
    return emails;
  }

  static async listUserEmails(): Promise<Array<string>> {
    const paginator = paginateQuery(
      {
        client: Email.#dynamoClient(),
      },
      {
        TableName: Resource.EmailTable.name,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': 'pk',
        },
        ExpressionAttributeValues: {
          ':pk': 'USER_EMAIL',
        },
      },
    );
    const emails: Array<string> = [];
    for await (const page of paginator) {
      for (const item of page?.Items ?? []) {
        emails.push(item.sk);
      }
    }
    return emails;
  }
}
