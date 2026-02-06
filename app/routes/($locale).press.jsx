import {useLoaderData} from '@remix-run/react';
import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import NavLink from '~/components/NavLink';
import Press from '~/components/Press';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hosh | Press`}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context}) {
  const isDev = process.env.NODE_ENV === 'development';
  const {storefront} = context;

  const [{metaobjects}] = await Promise.all([
    storefront.query(PRESS_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!metaobjects) {
    throw new Response('Not Found', {status: 404});
  }

  return {
    metaobjects,
    isDev,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function PressPage() {
  /** @type {LoaderReturnData} */
  const {metaobjects, isDev} = useLoaderData();
  console.log(metaobjects);

  return (
    <div className="press-page">
      <header>
        <p
          style={{
            textAlign: 'center',
            marginTop: '4rem',
            letterSpacing: '2px',
          }}
        >
          PRESS
        </p>
      </header>
      {metaobjects?.nodes.map((n) => (
        <Press data={n} key={n.id} rotateImages={false} isDev={isDev} />
      ))}
    </div>
  );
}

const PRESS_QUERY = `#graphql
query Artists($language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
  metaobjects(type: "press", first: 100) {
    nodes {
      id
      handle
      fields{
        key
        value
        type
        references(first:10) {
          nodes {
            ... on MediaImage {
              alt
              id
              image {
                url
                height
                id
                width
              }
            }
          }
        }
        reference{
          ...on MediaImage{
            alt
            id
            image{
              url
              height
              id
              width
            }
          }
          ...on Product{
            handle
            title
            featuredImage{
              altText
              url
              id
              width
              height
            }
          }
        }
      }
    }
  }
}`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
