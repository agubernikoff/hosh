import {useLoaderData} from '@remix-run/react';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import mapRichText from '~/helpers/MapRichText';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hosh | ${data?.page.title ?? ''}`}];
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
async function loadCriticalData({context, request, params}) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.handle, data: page});

  return {
    page,
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

export default function Page() {
  /** @type {LoaderReturnData} */
  const {page} = useLoaderData();

  const about_page_header = page?.sections?.reference?.fields.reduce(
    (acc, {key, value, reference, references}) => {
      if (key === 'article_link') acc[key] = JSON.parse(value);
      else acc[key] = references || reference || value;
      return acc;
    },
    {},
  );
  return (
    <div className="page">
      <header>
        <p
          style={{
            textAlign: 'center',
            marginTop: '4rem',
            marginBottom: '5rem',
            letterSpacing: '2px',
          }}
        >
          {page.title}
        </p>
      </header>
      {about_page_header && (
        <div className="about-page-header">
          {/* Hero Section */}
          <div className="about-hero">
            <img
              src={about_page_header?.hero?.image?.url}
              alt={about_page_header?.hero?.image?.altText || ''}
            />
            <div className="about-hero-content">
              <p className="about-hero-header">
                {about_page_header?.hero_header}
              </p>
              {about_page_header?.hero_logo?.image?.url && (
                <img
                  className="about-hero-logo"
                  src={about_page_header.hero_logo.image.url}
                  alt={about_page_header.hero_logo.image.altText || 'Logo'}
                />
              )}
            </div>
          </div>

          <div className="about-subhero-header hide-on-desktop">
            {about_page_header?.subhero_header &&
              mapRichText(JSON.parse(about_page_header.subhero_header))}
          </div>
          {/* Subhero Section */}
          <div className="about-subhero">
            <div className="about-subhero-image">
              {about_page_header?.subhero_image?.image?.url && (
                <img
                  src={about_page_header.subhero_image.image.url}
                  alt={about_page_header.subhero_image.image.altText || ''}
                />
              )}
            </div>
            <div className="about-subhero-text">
              <div>
                <div className="about-subhero-header hide-on-mobile">
                  {about_page_header?.subhero_header &&
                    mapRichText(JSON.parse(about_page_header.subhero_header))}
                </div>
                <div className="about-subhero-blurb">
                  {about_page_header?.subhero_blurb &&
                    mapRichText(JSON.parse(about_page_header.subhero_blurb))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <main dangerouslySetInnerHTML={{__html: page.body}} />
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
      sections:metafield(key: "about_page_header", namespace: "custom") {
        value
        reference {
          ... on Metaobject {
            type
            id
            fields {
              type
              value
              key
              reference {
                ... on MediaImage {
                  id
                  __typename
                  image {
                    url
                    height
                    id
                    width
                    altText
                  }
                }
              }
              references(first: 200) {
                nodes {
                  ... on MediaImage {
                    id
                    __typename
                    image {
                      url
                      height
                      id
                      width
                      altText
                    }
                  }
                  ... on Metaobject {
                    id
                    fields {
                      value
                      key
                      reference {
                        ... on MediaImage {
                          id
                          __typename
                          image {
                            url
                            height
                            id
                            width
                            altText
                          }
                        }
                      }
                      type
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
