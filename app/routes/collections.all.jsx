import {useLoaderData} from '@remix-run/react';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import {Filter} from './collections.$handle';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = () => {
  return [{title: `Hydrogen | Products`}];
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
async function loadCriticalData({context, request}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });
  let query = null;
  let reverse = false;
  let sortKey = null;

  if (searchParams.has('filter')) {
    query = `tag:${JSON.parse(searchParams.get('filter')).tag}`;
  }
  if (searchParams.has('sortKey')) sortKey = searchParams.get('sortKey');
  if (searchParams.has('reverse'))
    reverse = searchParams.get('reverse') === 'true';

  const [{products}, {search}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {
        ...paginationVariables,
        query,
        reverse,
        sortKey,
      },
    }),
    storefront.query(SEARCH_QUERY_FOR_FILTERS),
    // Add other queries here, so that they are loaded in parallel
  ]);
  return {
    products,
    filters: search?.productFilters,
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

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {products, filters} = useLoaderData();

  return (
    <div className="collection">
      {/* <h1>Products</h1> */}
      <Filter filters={filters} shopAll={true} />
      <PaginatedResourceSection
        connection={products}
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

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/product
const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...Product
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
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
  ${PRODUCT_FRAGMENT}
`;

const SEARCH_QUERY_FOR_FILTERS = `#graphql
query SEARCH {
  search(first: 1, query: "") {
    productFilters {
      id
      label
      presentation
      type
      values {
        id
        count
        input
        label
      }
    }
  }
}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
