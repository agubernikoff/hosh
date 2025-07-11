import {Await, useLoaderData} from '@remix-run/react';
import NavLink from '~/components/NavLink';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import model11 from '~/assets/model11.png';
import InfiniteCarousel from '~/components/Carousel';
import bingoart from 'app/assets/BINGO-ART 3.png';
import bingoart2 from 'app/assets/BINGO-ART 31.png';
import bingoart3 from 'app/assets/BINGO-ART 32.png';
import bingoart4 from 'app/assets/BINGO-ART 33.png';
import bingoart5 from 'app/assets/BINGO-ART 34.png';
import bingoart6 from 'app/assets/BINGO-ART 35.png';
import bingoart7 from 'app/assets/BINGO-ART 36.png';
/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Hosh'}];
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
  const handle = 'craig-george';
  const [{collection}, {metaobject}] = await Promise.all([
    context.storefront.query(NEW_ARRIVALS_QUERY, {
      variables: {handle},
    }),
    // Add other queries here, so that they are loaded in parallel
    context.storefront.query(ARTIST_QUERY, {
      variables: {handle},
    }),
  ]);

  let artist = null;
  if (metaobject) artist = metaobject;

  return {
    featuredCollection: collection,
    artist,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="home">
      <FeaturedCollection
        collection={data.featuredCollection}
        artist={data.artist}
      />
      <InfiniteCarousel
        images={[
          bingoart,
          bingoart2,
          bingoart3,
          bingoart4,
          bingoart5,
          bingoart6,
          bingoart7,
        ]}
      />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function FeaturedCollection({collection, artist}) {
  if (!collection) return null;
  const image = collection?.image;

  return (
    <div className="featured-artist-container">
      <div className="featured-artist-homepage-section">
        <div className="models-container">
          <img
            src={model11}
            style={{transform: 'translateY(-10%)', maxWidth: '50vw'}}
          />
        </div>
        <div className="shop-the-collection">
          <p>FEATURED ARTIST</p>
          <p className="artist-title">{collection.title.toUpperCase()}</p>
          <NavLink to={`/collections/${collection.handle}`}>
            SHOP THE COLLECTION
          </NavLink>
        </div>
      </div>
      <NavLink
        className="featured-collection"
        to={`/collections/${collection.handle}`}
      >
        {image && (
          <div className="featured-collection-image">
            <Image data={image} sizes="100vw" />
          </div>
        )}
      </NavLink>
      <div className="collection-title">
        <p style={{letterSpacing: '2px'}}>{collection.title.toUpperCase()}</p>
        {artist && (
          <p style={{letterSpacing: '2px'}}>
            <span>{artist?.tribe?.value}</span>
            {artist?.tribe?.value && artist?.discipline?.value && ' • '}
            <span>{artist?.discipline?.value}</span>
          </p>
        )}
      </div>
      <div className="recommended-products-grid">
        {collection.products.nodes.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
      <div
        style={{
          marginTop: '5rem',
          marginBottom: '9rem',
        }}
      >
        <NavLink
          to={`/collections/${collection.handle}`}
          style={{
            padding: '1rem',
            border: '1px solid black',
            boxSizing: 'border-box',
          }}
          className="s-t-c"
        >
          SHOP THE COLLECTION
        </NavLink>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */
function RecommendedProducts({products}) {
  return (
    <div className="recommended-products">
      <p
        style={{
          marginTop: '7rem',
          marginBottom: '3rem',
          textAlign: 'center',
          letterSpacing: '2px',
        }}
      >
        BEST SELLERS
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                    <ProductItem key={product.id} product={product} />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
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

const NEW_ARRIVALS_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query Collection(
    $country: CountryCode
    $language: LanguageCode
    $handle: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        id
        url
        altText
        width
        height
      }
      products(
        first: 3
      ) {
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
            swatch{
              color
            }
          }
        }
        nodes {
          ...Product
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 9, sortKey: BEST_SELLING, reverse: true) {
      nodes {
        ...Product
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const ARTIST_QUERY = `#graphql
  query Artist(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    metaobject(handle:{
        handle:$handle,type:"artist_data"
      }){
        tribe:field(key:"tribe") {
          key
          value
        }
        discipline:field(key:"discipline") {
          key
          value
        }
      }
    }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
