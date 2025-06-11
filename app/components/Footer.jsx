import {Suspense, useEffect, useState} from 'react';
import {Await, useLocation, useFetcher} from '@remix-run/react';
import logo from '../assets/Group 196.png';
import gila from '../assets/Gila-Black.png';
import InfiniteCarousel from '~/components/Carousel';
import car1 from 'app/assets/car1.png';
import car2 from 'app/assets/car2.png';
import car3 from 'app/assets/car3.png';
import NavLink from './NavLink';

/**
 * @param {FooterProps}
 */
export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
  selectedLocale,
  availableCountries,
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 499);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const location = useLocation();

  const excludedPaths = [
    '/pages/privacy-policy',
    '/pages/terms-of-service',
    '/pages/faq',
    '/pages/connect',
    '/pages/partners',
    '/pages/about',
  ];

  const shouldShowCarousel = !excludedPaths.includes(location.pathname);

  return (
    <Suspense>
      {shouldShowCarousel && <InfiniteCarousel images={[car1, car2, car3]} />}
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="footer">
            <div className="footer-grid">
              <div className="footer-left">
                <img
                  src={logo}
                  style={{width: '35%'}}
                  className="footer-logo"
                />
                <Suspense fallback={<div>Loading...</div>}>
                  <Await resolve={availableCountries}>
                    {(availableCountries) => (
                      <LocationForm
                        selectedLocale={selectedLocale}
                        availableCountries={availableCountries}
                      />
                    )}
                  </Await>
                </Suspense>
              </div>

              <div className="footer-center">
                {[
                  ['About', 'Partners', 'Contact', 'Returns & FAQS'],
                  ['Instagram'],
                  ['Privacy Policy', 'Terms of Service'],
                ].map((group, index) => (
                  <div className="footer-menu-column" key={index}>
                    {group.map((title) => {
                      const item = footer.menu?.items?.find(
                        (i) => i.title.toLowerCase() === title.toLowerCase(),
                      );
                      if (!item || !item.url) return null;

                      const url =
                        item.url.includes('myshopify.com') ||
                        item.url.includes(publicStoreDomain) ||
                        item.url.includes(header.shop.primaryDomain.url)
                          ? new URL(item.url).pathname
                          : item.url;

                      const isExternal = !url.startsWith('/');

                      return isExternal ? (
                        <a
                          href={url}
                          key={item.id}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <NavLink end key={item.id} prefetch="intent" to={url}>
                          {item.title}
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="footer-right">
                <form className="footer-newsletter">
                  <label>Sign up for our newsletter</label>
                  <input type="email" placeholder="Email address" />
                  <button type="submit">Submit</button>
                </form>
                <img src={gila} alt="Penguin" className="footer-icon" />
                <div className="footer-copyright">© 2024 HOSH</div>
              </div>
            </div>
            {isMobile && (
              <>
                <img src={gila} alt="Penguin" className="footer-icon" />
                <div className="footer-copyright">© 2024 HOSH</div>
              </>
            )}
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

export function LocationForm({availableCountries, selectedLocale, close}) {
  console.log(availableCountries);
  const fetcher = useFetcher();
  fetcher.formAction = '/locale';
  const {pathname, search} = useLocation();

  const [country, setCountry] = useState({
    currency: {
      isoCode: 'USD',
      name: 'United States Dollar',
      symbol: '$',
    },
    isoCode: 'US',
    name: 'United States',
    unitSystem: 'IMPERIAL_SYSTEM',
  });

  useEffect(() => {
    setCountry(availableCountries.localization.country);
  }, [availableCountries, pathname, selectedLocale]);

  const sortedCountries = availableCountries.localization.availableCountries
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const countryOptions = [
    country,
    ...sortedCountries.filter((c) => c.isoCode !== country.isoCode),
  ];

  const strippedPathname = pathname.includes('EN-')
    ? pathname
        .split('/')
        .filter((part) => !part.includes('EN-'))
        .join('/')
    : pathname;

  const handleChange = (e) => {
    const selectedIso = e.target.value;
    const selected = countryOptions.find((c) => c.isoCode === selectedIso);
    if (!selected) return;

    setCountry(selected);
    close?.();

    const formData = new FormData();
    formData.append('country', selected.isoCode);
    formData.append('path', `${strippedPathname}${search}`);

    fetcher.submit(formData, {method: 'POST', preventScrollReset: true});
  };

  return (
    <select
      id="country-select"
      value={country.isoCode}
      onChange={handleChange}
      className="footer-locale"
    >
      {countryOptions.map((c) => (
        <option key={c.isoCode} value={c.isoCode}>
          {`${c.name} (${c.currency.isoCode} ${c.currency.symbol})`}
        </option>
      ))}
    </select>
  );
}

/**
 * @param {{
 *   isActive: boolean;
 *   isPending: boolean;
 * }}
 */
function activeLinkStyle({isActive, isPending}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'white',
  };
}

/**
 * @typedef {Object} FooterProps
 * @property {Promise<FooterQuery|null>} footer
 * @property {HeaderQuery} header
 * @property {string} publicStoreDomain
 */

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
