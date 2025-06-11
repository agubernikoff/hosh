import {Await, useLoaderData} from '@remix-run/react';
import NavLink from '~/components/NavLink';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import model1 from '~/assets/model1.png';
import model2 from '~/assets/model2.png';
import InfiniteCarousel from '~/components/Carousel';
import car1 from 'app/assets/car1.png';
import car2 from 'app/assets/car2.png';
import car3 from 'app/assets/car3.png';
/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Hydrogen | Home'}];
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
  const [{collection}] = await Promise.all([
    context.storefront.query(NEW_ARRIVALS_QUERY, {
      variables: {handle: 'craig-george'},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    featuredCollection: collection,
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
      <FeaturedCollection collection={data.featuredCollection} />
      <InfiniteCarousel images={[car1, car2, car3]} />
      <RecommendedProducts products={data.recommendedProducts} />
      {/* <InfiniteCarousel images={[car1, car2, car3]} /> */}
    </div>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function FeaturedCollection({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  console.log(collection);
  return (
    <div className="featured-artist-container">
      <div className="featured-artist-homepage-section">
        <div className="models-container">
          <img src={model1} />
          <img src={model2} />
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
      <p
        style={{marginBlock: '3rem', textAlign: 'center'}}
      >{`${collection.title.toUpperCase()} COLLECTION`}</p>
      <div className="recommended-products-grid">
        {collection.products.nodes.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
      <div
        style={{
          marginBlock: '5rem',
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
      <p style={{marginBlock: '3rem', textAlign: 'center'}}>BEST SELLERS</p>
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

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
