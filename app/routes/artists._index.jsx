import {useLoaderData, NavLink} from '@remix-run/react';
import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';

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
async function loadCriticalData({context}) {
  const {storefront} = context;

  const [{metaobjects}] = await Promise.all([
    storefront.query(ARTISTS_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!metaobjects) {
    throw new Response('Not Found', {status: 404});
  }

  return {
    metaobjects,
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
  const {metaobjects} = useLoaderData();
  console.log(metaobjects);

  const [hovered, setHovered] = useState();
  function hoverArtist(artist) {
    setHovered(artist);
  }
  function clearHovered() {
    setHovered();
  }

  return (
    <div className="artists-page">
      <AnimatePresence mode="popLayout">
        <motion.div
          style={{
            textAlign: 'center',
            width: '100%',
            minHeight: '50px',
            paddingBlock: '2rem',
          }}
          key={`${hovered?.handle}key`}
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
        >
          <p>{hovered?.name?.value.toUpperCase() || 'ARTISTS'}</p>
          {hovered ? (
            <p>
              <span>{hovered?.tribe?.value}</span>
              {hovered?.tribe?.value && hovered?.discipline?.value && ' • '}
              <span>{hovered?.discipline?.value}</span>
            </p>
          ) : (
            <br />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="artists-grid">
        {metaobjects?.nodes.map((artist) => (
          <Thumbnails
            artist={artist}
            hovered={hovered?.name === artist.name}
            setHovered={setHovered}
            clearHovered={clearHovered}
          />
        ))}
      </div>
    </div>
  );
}

function Thumbnails({artist, hovered, setHovered, clearHovered}) {
  console.log(artist);
  return (
    <NavLink
      to={`/artists/${artist.handle}`}
      className="artist-thumbnail"
      onMouseEnter={() => setHovered(artist)}
      onMouseLeave={clearHovered}
    >
      <img
        src={artist?.thumbnails?.references?.nodes[0]?.image?.url}
        alt={artist?.thumbnails?.references?.nodes[0]?.alt}
        style={{
          opacity: hovered ? 0 : 1,
          transition: 'opacity 300ms ease-in-out',
        }}
      />
      <img
        src={artist?.thumbnails?.references?.nodes[1]?.image?.url}
        alt={artist?.thumbnails?.references?.nodes[1]?.alt}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 300ms ease-in-out',
        }}
      />
      <p>{artist.name.value}</p>
      <p>Learn More</p>
    </NavLink>
  );
}

const ARTISTS_QUERY = `#graphql
query Artists($language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
  metaobjects(type: "artist_data", first: 100) {
    nodes {
      handle
      name: field(key: "name") {
        value
      }
      tribe: field(key: "tribe") {
        value
      }
      discipline: field(key: "discipline") {
        value
      }
      thumbnails: field(key: "thumbnails") {
        references(first: 10) {
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
      }
    }
  }
}`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
