import {useLoaderData, NavLink, redirect} from '@remix-run/react';
import InfiniteCarousel from '~/components/Carousel';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Image} from '@shopify/hydrogen';
import Expandable from '~/components/Expandable';
import {useState, useEffect, useRef} from 'react';
import mapRichText from '~/helpers/MapRichText';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import {Filter} from './collections.$handle';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  //   return [{title: `Hydrogen | ${data?.page.title ?? ''}`}];
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
  const {handle} = params;
  const {storefront} = context;
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  const filters = [];
  let reverse = false;
  let sortKey = null;

  if (!handle) {
    throw redirect('/artists');
  }

  if (searchParams.has('filter')) {
    filters.push(...searchParams.getAll('filter').map((x) => JSON.parse(x)));
  }
  if (searchParams.has('sortKey')) sortKey = searchParams.get('sortKey');
  if (searchParams.has('reverse'))
    reverse = searchParams.get('reverse') === 'true';

  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{metaobject}] = await Promise.all([
    context.storefront.query(ARTIST_QUERY, {
      variables: {
        handle: params.handle,
        filters,
        reverse,
        sortKey,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!metaobject) {
    throw new Response('Not Found', {status: 404});
  }

  return {
    metaobject,
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

function useIsFirstRender() {
  const isFirst = useRef(true);
  useEffect(() => {
    isFirst.current = false;
  }, []);
  return isFirst.current;
}

export default function Page() {
  /** @type {LoaderReturnData} */
  const {metaobject} = useLoaderData();
  console.log('x', metaobject);
  const artist = metaobject?.fields.reduce(
    (acc, {key, value, reference, references}) => {
      acc[key] = references || reference || value;
      return acc;
    },
    {},
  );

  console.log(artist);

  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const isFirstRender = useIsFirstRender();

  return (
    <div className="artist-page">
      <div>
        <p>{artist?.name}</p>
        <p>
          <span>{artist?.tribe}</span>
          {artist?.tribe && artist?.discipline && ' • '}
          <span>{artist?.discipline}</span>
        </p>
      </div>
      {artist?.images?.nodes && (
        <InfiniteCarousel
          images={artist?.images?.nodes?.map((n) => n?.image?.url)}
          width={70}
        />
      )}
      {artist?.featured_image && (
        <Image
          data={artist?.featured_image.image}
          sizes="(min-width: 45em) 50vw, 100vw"
          alt={artist?.featured_image.alt}
          width={'30vw'}
        />
      )}
      {artist?.featured_product && (
        <NavLink to={`/products/${artist?.featured_product?.handle}`}>
          <Image
            data={artist?.featured_product?.featuredImage}
            sizes="(min-width: 45em) 50vw, 100vw"
            alt={artist?.featured_product?.featuredImage?.alt}
            width={'30vw'}
          />
          <p style={{marginTop: '2rem'}}>
            {`${artist?.featured_product?.title} by ${artist?.name}  |  `}
            <strong>SHOP</strong>
          </p>
        </NavLink>
      )}
      <div className="artist-expandables-div">
        {[
          {
            title: 'Artist Bio',
            details: artist?.biography
              ? mapRichText(JSON.parse(artist?.biography))
              : null,
          },
          {
            title: 'Awards & Exhibitions',
            details: artist.awards
              ? JSON.parse(artist?.awards).map((award) => (
                  <p key={award}>{award}</p>
                ))
              : null,
          },
        ]
          .filter((section) => section.details)
          .map((section) => (
            <Expandable
              key={section.title}
              openSection={openSection}
              toggleSection={toggleSection}
              title={section.title}
              details={section.details}
              isFirstRender={isFirstRender}
            />
          ))}
      </div>
      {artist?.collection?.products?.nodes?.length > 0 && (
        <div
          style={{
            width: '100%',
            paddingInline: '10vw',
            boxSizing: 'border-box',
          }}
        >
          <Filter filters={artist?.collection?.products?.filters} />
          <PaginatedResourceSection
            connection={artist?.collection?.products}
            resourcesClassName="products-grid"
          >
            {({node: product, index}) => (
              <ProductItem
                key={product.id}
                product={product}
                loading={index < 8 ? 'eager' : undefined}
              />
            )}
          </PaginatedResourceSection>
        </div>
      )}
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 10) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      ...ProductVariant
    }
    adjacentVariants {
      ...ProductVariant
    }
    priceRange{
      minVariantPrice{
        amount
        currencyCode
      }
    }
    seo {
      description
      title
    }
    artist:metafield(namespace:"custom",key:"artist_name"){
      value
    }
    description2:metafield(namespace:"custom",key:"product_description"){
      value
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const ARTIST_QUERY = `#graphql
  query Artist(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
    $filters: [ProductFilter!]
    $reverse: Boolean
    $sortKey: ProductCollectionSortKeys
  )
  @inContext(language: $language, country: $country) {
    metaobject(handle:{
        handle:$handle,type:"artist_data"
      }){
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
            ...on Collection{
              products(
                first: 12
                filters: $filters,
                reverse: $reverse,
                sortKey: $sortKey){
                nodes{
                  ...Product
                }
                pageInfo {
                  hasPreviousPage
                  hasNextPage
                  endCursor
                  startCursor
                }
                filters{
                  id
                  label
                  presentation
                  type
                  values{
                    count
                    id
                    input
                    label
                  }
                }
              }
            }
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
  ${PRODUCT_FRAGMENT}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
