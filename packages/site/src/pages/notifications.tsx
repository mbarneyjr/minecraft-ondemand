import qs from 'querystring';
import { Context } from 'hono';
import { createFactory } from 'hono/factory';
import { Email } from '@minecraft-ondemand/core/email';
import { Layout } from '#src/components/layout.js';
import { ErrorIcon } from '#src/icons/error.js';
import { SuccessIcon } from '#src/icons/success.js';
import { FC } from 'hono/jsx';

const factory = createFactory();

export const notifications = factory.createApp();

const NotificationControl: FC<{ error?: string; success?: string; email?: string; subscribed?: boolean }> = (props) => {
  const messageStyles = props.error !== undefined ? 'text-red-800 bg-red-200' : 'text-green-800 bg-green-200';
  const message = {
    'invalid-email': 'Invalid Email. Please try again.',
    subscribed: 'You are now subscribed!',
    unsubscribed: 'You are now unsubscribed!',
  }[(props.error || props.success) ?? ''];
  const icon =
    props.error !== undefined ? (
      <ErrorIcon className="inline h-6 w-6 text-red-800" />
    ) : (
      <SuccessIcon className="inline h-6 w-6 text-green-800" />
    );
  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-4 p-4">
      <h1 className="text-center text-2xl">Email Notification Settings</h1>
      {message !== undefined ? (
        <div className={`${messageStyles} flex items-center justify-center gap-1 p-4`}>
          {icon}
          <p className={''}>{message}</p>
        </div>
      ) : null}
      <div className="rounded-lg bg-green-100 p-6 shadow-lg">
        <p className="pb-4 text-center">Get notified whenever the server is running.</p>
        <form
          id="notifications"
          action="/notifications"
          method="post"
          className="grid grid-cols-[auto_1fr] grid-rows-2 gap-4"
        >
          <label for="email" className="my-auto text-right">
            Your email:
          </label>
          <input
            type="text"
            name="email"
            placeholder="you@email.com"
            value={props.email}
            className="flex-grow rounded-lg border-2 border-green-300 p-2 text-sm"
          />
          <label for="subscribe" className="my-auto text-right">
            Subscribe
          </label>
          <input
            type="checkbox"
            checked={props.subscribed}
            name="subscribe"
            value="true"
            className="h-8 w-8 rounded-lg border-2 border-green-300 p-2 text-sm accent-green-800"
          />
        </form>
        <button form="notifications" type="submit" className="w-full rounded-lg bg-green-800 p-4 font-bold text-white">
          Submit Settings
        </button>
        <ul className="flex flex-col rounded-lg"></ul>
      </div>
    </div>
  );
};

notifications.get('/', async (c) => {
  const { error, success } = c.req.query();
  return c.html(
    <Layout c={c}>
      <NotificationControl error={error} success={success} />
    </Layout>,
  );
});

notifications.get('/:email', async (c) => {
  let { error, success, unsubscribe } = c.req.query();
  const email = c.req.param('email');
  const subscribed = (await Email.getUserEmail(email)) !== null;
  if (unsubscribe !== undefined) {
    await Email.removeUserEmail(email);
    success = 'unsubscribed';
  }
  return c.html(
    <Layout c={c}>
      <NotificationControl error={error} success={success} email={email} subscribed={subscribed} />
    </Layout>,
  );
});

notifications.post('/', async (c) => {
  const body = await c.req.formData();
  const email = body.get('email');
  const subscribe = body.get('subscribe') === 'true';
  if (typeof email !== 'string' || !email) {
    return c.redirect(`/notifications?${qs.stringify({ error: 'invalid-email' })}`);
  }
  if (subscribe) {
    await Email.addUserEmail(email);
    return c.redirect(`/notifications/${email}?${qs.stringify({ success: 'subscribed' })}`);
  } else {
    await Email.removeUserEmail(email);
    return c.redirect(`/notifications/${email}?${qs.stringify({ success: 'unsubscribed' })}`);
  }
});
