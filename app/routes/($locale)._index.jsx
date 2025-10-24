import {Await, useLoaderData} from '@remix-run/react';
import NavLink from '~/components/NavLink';
import {Suspense, useState, useEffect} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import model11 from '~/assets/model11.png';
import InfiniteCarousel from '~/components/Carousel';
import poster from 'app/assets/Group 780.png';
import mposter from 'app/assets/mobile-poster.png';
import jersey from 'app/assets/jersey1.png';
import jersey2 from 'app/assets/jersey2.png';
import hero2 from 'app/assets/hero2.jpg';
import Press from '~/components/Press';
import carousel1 from 'app/assets/Slider A.png';
import carousel2 from 'app/assets/Slider B.png';
import carousel3 from 'app/assets/Slider C.png';
import carousel4 from 'app/assets/Slider D.png';
import carousel5 from 'app/assets/Slider E.png';
import carousel6 from 'app/assets/Slider F.png';
import desktop1 from 'app/assets/Slider 1.png';
import desktop2 from 'app/assets/Slider 2.png';
import desktop3 from 'app/assets/Slider 3.png';
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
  const isDev = process.env.NODE_ENV === 'development';
  const handle = 'the-begay-sisters';
  const [{collection}, {metaobject}, press, latest] = await Promise.all([
    context.storefront.query(NEW_ARRIVALS_QUERY, {
      variables: {handle, first: 3},
    }),
    // Add other queries here, so that they are loaded in parallel
    context.storefront.query(ARTIST_QUERY, {
      variables: {handle},
    }),
    context.storefront.query(PRESS_QUERY),
    context.storefront.query(NEW_ARRIVALS_QUERY, {
      variables: {
        handle: 'latest-releases',
        first: 6,
      },
    }),
  ]);

  let artist = null;
  if (metaobject) artist = metaobject;

  return {
    featuredCollection: collection,
    artist,
    isDev,
    press: press.metaobject,
    latest: latest.collection,
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
  const [showPopup, setShowPopup] = useState(false);
  const [visiblePopup, setVisiblePopup] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
      // Delay setting visiblePopup to allow transition
      setTimeout(() => setVisiblePopup(true), 50);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      {showPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            opacity: visiblePopup ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
          }}
          className="popup-bg"
        >
          <div
            className="poster"
            style={{
              position: 'relative',
            }}
          >
            <img
              className="poster-img"
              src={poster}
              style={{width: '50%', maxWidth: '90vw', maxHeight: '90vh'}}
            />
            <img
              className="mobile-poster"
              src={mposter}
              style={{
                width: '100%',
                // maxWidth: '90vw',
                maxHeight: '90vh',
                height: 'auto',
                objectFit: 'cover',
              }}
            />
            <div>
              <div>
                <img src={jersey} style={{flex: 1}} />
                <img src={jersey2} style={{flex: 1}} />
              </div>
              <p>
                “This imagined team is my way of giving Native actors the
                spotlight they rarely had.”
              </p>
              <p>Craig George</p>
              <NavLink
                to="/collections/hollywood-extras-collection"
                style={{textDecoration: 'underline'}}
              >
                Now Available
              </NavLink>
            </div>
            <button
              onClick={() => {
                setVisiblePopup(false);
                setTimeout(() => setShowPopup(false), 1000); // match transition duration
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                color: 'black',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="home">
        <Hero collection={data.featuredCollection} />{' '}
        <Press data={data.press} rotateImages={true} />
        <LatestReleases collection={data.latest} />{' '}
        <InfiniteCarousel
          images={[desktop1, desktop2, desktop3]}
          hideOn={'mobile'}
        />
        <InfiniteCarousel
          images={[
            carousel1,
            carousel2,
            carousel3,
            carousel4,
            carousel5,
            carousel6,
          ]}
          hideOn={'desktop'}
        />
        <RecommendedProducts products={data.recommendedProducts} />
      </div>
    </>
  );
}

function Hero({collection}) {
  return (
    <div className={`featured-artist-container fac-dev`}>
      <div className="featured-artist-homepage-section">
        <div className="models-container">
          <img src={hero2} style={{width: '100%'}} />
        </div>
        <div className="shop-the-collection">
          <p>FEATURED COLLECTION</p>
          <p className="artist-title">{collection.title.toUpperCase()}</p>
          <NavLink to={`/collections/${collection.handle}`}>SHOP</NavLink>
        </div>
      </div>
    </div>
  );
}
function LatestReleases({collection}) {
  return (
    <div className="featured-artist-container">
      <div className="collection-title">
        <p style={{letterSpacing: '2px'}}>LATEST RELEASES</p>
      </div>
      <div className="recommended-products-grid">
        {collection.products.nodes.map((product) => (
          <ProductItem
            key={`latest-${product.id}`}
            product={product}
            layoutId={`latest-${product.id}`}
          />
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
    $first: Int
    $reverse: Boolean
    $sortKey: ProductCollectionSortKeys
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
        first: $first
        reverse: $reverse,
        sortKey: $sortKey
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

const PRESS_QUERY = `#graphql
  query Press(
    $language: LanguageCode,
    $country: CountryCode
  )
  @inContext(language: $language, country: $country) {
    metaobject(handle:{
        handle:"hosh-launch",type:"press"
      }){
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
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
