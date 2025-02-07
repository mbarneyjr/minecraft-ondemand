import qs from 'querystring';
import { createFactory } from 'hono/factory';
import { Email } from '@minecraft-ondemand/core/email';
import { Layout } from '#src/components/layout.js';
import { ErrorIcon } from '#src/icons/error.js';
import { SuccessIcon } from '#src/icons/success.js';

const factory = createFactory();

export const notifications = factory.createApp();

notifications.get('/', async (c) => {
  const { error, success } = c.req.query();
  const messageStyles = error !== undefined ? 'text-red-800 bg-red-200' : 'text-green-800 bg-green-200';
  const message = {
    'invalid-email': 'Invalid Email. Please try again.',
    subscribed: 'You are now subscribed!',
    unsubscribed: 'You are now unsubscribed!',
  }[(error || success) ?? ''];
  const icon =
    error !== undefined ? (
      <ErrorIcon className="inline h-6 w-6 text-red-800" />
    ) : (
      <SuccessIcon className="inline h-6 w-6 text-green-800" />
    );
  return c.html(
    <Layout c={c}>
      <div className="mx-auto flex max-w-screen-lg flex-col gap-4 p-4">
        <h1 className="text-center text-2xl">Email Notification Settings</h1>
        {message !== undefined ? (
          <div className={`${messageStyles} flex items-center justify-center gap-1 p-4`}>
            {icon}
            <p className={''}>{message}</p>
          </div>
        ) : null}
        <div className="rounded-lg bg-green-100 p-6 shadow-lg">
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
              className="flex-grow rounded-lg border-2 border-green-300 p-2 text-sm"
            />
            <label for="subscribe" className="my-auto text-right">
              Subscribe
            </label>
            <input
              type="checkbox"
              name="subscribe"
              value="true"
              className="h-8 w-8 rounded-lg border-2 border-green-300 p-2 text-sm accent-green-800"
            />
          </form>
          <button
            form="notifications"
            type="submit"
            className="w-full rounded-lg bg-green-800 p-4 font-bold text-white"
          >
            Submit Settings
          </button>
          <ul className="flex flex-col rounded-lg"></ul>
        </div>
      </div>
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
    return c.redirect(`/notifications?${qs.stringify({ success: 'subscribed' })}`);
  } else {
    await Email.removeUserEmail(email);
    return c.redirect(`/notifications?${qs.stringify({ success: 'unsubscribed' })}`);
  }
});
