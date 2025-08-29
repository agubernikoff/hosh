import {RemixServer} from '@remix-run/react';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

/**
 * @param {Request} request
 * @param {number} responseStatusCode
 * @param {Headers} responseHeaders
 * @param {EntryContext} remixContext
 * @param {AppLoadContext} context
 */
export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
  context,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    scriptSrc: [
      'https://cdn.shopify.com',
      'https://cdn.shopifycloud.com',
      "'self'",
      "'unsafe-inline'",
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://googleads.g.doubleclick.net',
      'https://www.google.com',
      'https://tagmanager.google.com',
      'https://connect.facebook.net',
      'https://dashboard.heatmap.com',
      'https://heatmap.com',
      'https://*.heatmap.com',
    ],
    connectSrc: [
      'https://klaviyo.com',
      'https://*.klaviyo.com',
      'https://cdn.shopify.com',
      'http://localhost:3000',
      'https://*.klaviyo.com/*',
      'https://www.googletagmanager.com',
      'https://www.google.com',
      'https://td.doubleclick.net',
      'https://www.google-analytics.com',
      'https://region1.google-analytics.com',
      'https://google-analytics.com',
      'https://googleads.g.doubleclick.net',
      'https://www.google.com',
      'https://google.com',
      'https://td.doubleclick.net',
      'https://connect.facebook.net',
      'https://www.facebook.com',
      'https://monorail-edge.shopifysvc.com',
      'https://*.tryhydrogen.dev',
      "'self'",
      'http://localhost:*',
      'ws://localhost:*',
      'ws://127.0.0.1:*',
      'https://dashboard.heatmap.com',
      'https://heatmap.com',
      'https://*.heatmap.com',
    ],
    frameSrc: [
      'https://www.youtube.com/',
      'https://www.googletagmanager.com',
      'https://td.doubleclick.net',
      'https://www.facebook.com',
    ],
    imgSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://www.google.com',
      'https://www.googletagmanager.com',
      'https://www.googleadservices.com',
      'https://www.gstatic.com',
      'https://tpc.googlesyndication.com',
      'https://www.google-analytics.com',
      'https://googleads.g.doubleclick.net',
      'https://pagead2.googlesyndication.com',
      'https://www.facebook.com',
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} nonce={nonce} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    context?.env?.NODE_ENV === 'production';

  responseHeaders.set(
    isProd ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
    header,
  );

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/remix-oxygen').EntryContext} EntryContext */
/** @typedef {import('@shopify/remix-oxygen').AppLoadContext} AppLoadContext */
