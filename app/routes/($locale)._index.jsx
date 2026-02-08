import {Await, useLoaderData} from '@remix-run/react';
import NavLink from '~/components/NavLink';
import {Suspense, useState, useEffect} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {motion, AnimatePresence} from 'framer-motion';
import model11 from '~/assets/model11.png';
import poster from 'app/assets/Group 780.png';
import mposter from 'app/assets/mobile-poster.png';
import jersey from 'app/assets/jersey1.png';
import jersey2 from 'app/assets/jersey2.png';
import hero3 from 'app/assets/hero3.jpg';
import Press from '~/components/Press';
import mapRichText from '~/helpers/MapRichText';
import {PRESS_QUERY} from './($locale).press';
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
  const handle = 'the-begay-sisters';
  const [{collection}, {metaobject}, press, latest, subhero] =
    await Promise.all([
      context.storefront.query(NEW_ARRIVALS_QUERY, {
        variables: {handle, first: 3},
      }),
      // Add other queries here, so that they are loaded in parallel
      context.storefront.query(ARTIST_QUERY, {
        variables: {handle},
      }),
      context.storefront.query(PRESS_QUERY, {
        variables: {
          first: 5,
        },
      }),
      context.storefront.query(NEW_ARRIVALS_QUERY, {
        variables: {
          handle: 'hollywood-extras-collection',
          first: 3,
        },
      }),
      context.storefront.query(SUBHERO_QUERY),
    ]);

  let artist = null;
  if (metaobject) artist = metaobject;

  return {
    featuredCollection: collection,
    artist,
    press: press?.metaobjects?.nodes || [],
    latest: latest.collection,
    subhero: subhero.metaobject,
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
        <Hero />
        <Subhero subhero={data.subhero} />
        <LatestReleases collection={data.latest} />
        <PressSection data={data.press} />
        <RecommendedProducts products={data.recommendedProducts} />
      </div>
    </>
  );
}

function Hero() {
  return (
    <div className="featured-artist-container fac-dev">
      <div className="featured-artist-homepage-section">
        <div className="models-container">
          <img src={hero3} style={{width: '100%'}} alt="" />
        </div>
        <div className="shop-the-collection">
          <p className="artist-title">Welcome to the world of HOSH</p>
          <NavLink to="/collections/all-products">Shop All Products</NavLink>
        </div>
      </div>
    </div>
  );
}

function Subhero({subhero}) {
  if (!subhero) return null;
  const imagesField = subhero.fields.find((f) => f.key === 'images');
  const blurb = subhero.fields.find((f) => f.key === 'blurb');

  return (
    <div className="subhero-section">
      {blurb && (
        <p className="subhero-blurb">{mapRichText(JSON.parse(blurb.value))}</p>
      )}
      <div className="subhero-images">
        {imagesField?.references?.nodes.map((image) => (
          <div key={image.id}>
            <Image data={image.image} sizes="34vw" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LatestReleases({collection}) {
  return (
    <div className="featured-artist-container latest-releases-container">
      <div className="collection-title">
        <p style={{letterSpacing: '2px'}}>FEATURED COLLECTION</p>
        <p style={{letterSpacing: '2px', fontSize: '32px'}}>
          THE {collection.title.toUpperCase()}
        </p>
        <div
          style={{
            marginTop: '2rem',
          }}
        >
          <NavLink
            to={`/collections/${collection.handle}`}
            style={{
              padding: '1rem 4rem',
              border: '1px solid black',
              boxSizing: 'border-box',
            }}
            className="s-t-c"
          >
            SHOP
          </NavLink>
        </div>
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
    </div>
  );
}

function PressSection({data}) {
  const [selectedPress, setSelectedPress] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const interval = setInterval(() => {
      setDirection(1);
      setSelectedPress((prev) => (prev + 1) % data.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [data]);

  if (!data || data.length === 0) return null;

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
    }),
    center: {
      x: 0,
    },
    exit: (dir) => ({
      x: dir > 0 ? '-100%' : '100%',
    }),
  };

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100vw',
        marginLeft: '-1rem',
      }}
      className="homepage-press-container"
    >
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={data[selectedPress].id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{duration: 0.5, ease: 'easeInOut'}}
          style={{height: '100%'}}
        >
          <Press data={data[selectedPress]} />
        </motion.div>
      </AnimatePresence>
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

const SUBHERO_QUERY = `#graphql
  query Press(
    $language: LanguageCode,
    $country: CountryCode
  )
  @inContext(language: $language, country: $country) {
    metaobject(handle:{
        handle:"homepage-sub-hero-section-pgedekuh",type:"homepage_sub_hero_section"
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
