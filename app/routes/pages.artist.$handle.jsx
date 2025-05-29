import {useLoaderData} from '@remix-run/react';
import InfiniteCarousel from '~/components/Carousel';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Image} from '@shopify/hydrogen';
import Expandable from '~/components/Expandable';
import {useState, useEffect, useRef} from 'react';

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
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{metaobject}] = await Promise.all([
    context.storefront.query(ARTIST_QUERY, {
      variables: {
        handle: params.handle,
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
  console.log(metaobject);
  const artist = metaobject?.fields.reduce((acc, {key, value, reference}) => {
    acc[key] = reference || value;
    return acc;
  }, {});

  console.log(artist);

  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const isFirstRender = useIsFirstRender();

  return (
    <div className="artist-page">
      <p>{artist.name}</p>
      <p>
        <span>{artist.tribe}</span>
        {' • '}
        <span>{artist.discipline}</span>
      </p>
      {artist.banner_images && <InfiniteCarousel />}
      <Image
        data={artist.featured_image.image}
        sizes="(min-width: 45em) 50vw, 100vw"
        alt={artist.featured_image.alt}
        width={'50vw'}
      />
      {/* insert product modal here */}
      <div className="artist-expandables-div">
        {[
          {
            title: 'Artist Bio',
            details: artist.biography,
          },
          {
            title: 'Awards & Exhibitions',
            details: JSON.parse(artist.awards).map((award) => (
              <p key={award.split(' ')[0]}>{award}</p>
            )),
          },
        ].map((section) => (
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
    </div>
  );
}

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
        fields{
          key
          value
          type
          reference{
            ...on Collection{
              products(first: 12){
                nodes{
                  handle
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
          }
        }
      }
    }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
