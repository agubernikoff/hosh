import {Suspense, useEffect, useState, useRef} from 'react';
import {Await, useLocation, useFetcher} from '@remix-run/react';
import logo from '../assets/Group 196.png';
import gila from '../assets/Gila-Black.png';
import InfiniteCarousel from '~/components/Carousel';
import car1 from 'app/assets/x1.png';
import car2 from 'app/assets/x2.png';
import car3 from 'app/assets/x3.png';
import bingoart from 'app/assets/BINGO-ART 3.png';
import bingoart2 from 'app/assets/BINGO-ART 31.png';
import bingoart3 from 'app/assets/BINGO-ART 32.png';
import bingoart4 from 'app/assets/BINGO-ART 33.png';
import bingoart5 from 'app/assets/BINGO-ART 34.png';
import bingoart6 from 'app/assets/BINGO-ART 35.png';
import bingoart7 from 'app/assets/BINGO-ART 36.png';
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

  const excludedPaths = ['/pages/about'];

  const shouldShowCarousel = !excludedPaths.includes(location.pathname);

  return (
    <Suspense>
      {shouldShowCarousel && (
        <InfiniteCarousel
          images={
            location.pathname.includes('artist') ||
            location.pathname.includes('blog')
              ? [
                  bingoart,
                  bingoart2,
                  bingoart3,
                  bingoart4,
                  bingoart5,
                  bingoart6,
                  bingoart7,
                ]
              : [car1, car2, car3]
          }
        />
      )}
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
                <Newsletter />
                <img src={gila} alt="Penguin" className="footer-icon" />
                <div className="footer-copyright">
                  <span style={{fontSize: '16px'}}>©</span> 2025 HOSH
                </div>
              </div>
            </div>
            {isMobile && (
              <>
                <img src={gila} alt="Penguin" className="footer-icon" />
                <div className="footer-copyright">
                  <span style={{fontSize: '16px'}}>©</span> 2025 HOSH
                </div>
              </>
            )}
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

export function LocationForm({availableCountries, selectedLocale, close}) {
  const fetcher = useFetcher();
  fetcher.formAction = '/locale';

  const {pathname, search} = useLocation();
  const dropdownRef = useRef(null);
  const optionsRef = useRef([]);
  const buttonRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [country, setCountry] = useState({
    currency: {isoCode: 'USD', name: 'United States Dollar', symbol: '$'},
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

  const handleSelect = (selected) => {
    setCountry(selected);
    setIsOpen(false);
    setFocusedIndex(-1);
    close?.();

    const formData = new FormData();
    formData.append('country', selected.isoCode);
    formData.append('path', `${strippedPathname}${search}`);

    fetcher.submit(formData, {method: 'POST', preventScrollReset: true});
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (
      !isOpen &&
      (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')
    ) {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex(0);
      return;
    }

    if (isOpen) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % countryOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev === 0 || prev === -1 ? countryOptions.length - 1 : prev - 1,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0) {
          handleSelect(countryOptions[focusedIndex]);
        }
      }
    }
  };

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      optionsRef.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <button
        ref={buttonRef}
        id="country-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="country-listbox"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        className="dropdown-toggle footer-locale"
      >
        <span>{`${country.name} (${country.currency.isoCode} ${country.currency.symbol})`}</span>
        <svg
          width="10"
          height="7"
          viewBox="0 0 10 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.35401 1.43596C9.30756 1.38939 9.25238 1.35245 9.19164 1.32724C9.13089 1.30204 9.06577 1.28906 9.00001 1.28906C8.93424 1.28906 8.86912 1.30204 8.80837 1.32724C8.74763 1.35245 8.69245 1.38939 8.64601 1.43596L5.00001 5.08296L1.35401 1.43596C1.26012 1.34207 1.13278 1.28932 1.00001 1.28932C0.86723 1.28932 0.739893 1.34207 0.646006 1.43596C0.552119 1.52984 0.499374 1.65718 0.499374 1.78996C0.499374 1.92273 0.552119 2.05007 0.646006 2.14396L4.64601 6.14396C4.69245 6.19052 4.74763 6.22746 4.80837 6.25267C4.86912 6.27788 4.93424 6.29085 5.00001 6.29085C5.06577 6.29085 5.13089 6.27788 5.19164 6.25267C5.25239 6.22746 5.30756 6.19052 5.35401 6.14396L9.35401 2.14396C9.40057 2.09751 9.43751 2.04233 9.46272 1.98159C9.48792 1.92084 9.5009 1.85572 9.5009 1.78996C9.5009 1.72419 9.48792 1.65907 9.46272 1.59832C9.43751 1.53758 9.40057 1.4824 9.35401 1.43596Z"
            fill="#4D4D4D"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          id="country-listbox"
          role="listbox"
          tabIndex={-1}
          aria-labelledby="country-button"
          className="dropdown-menu"
        >
          {countryOptions.map((c, index) => (
            <div
              key={c.isoCode}
              role="option"
              aria-selected={c.isoCode === country.isoCode}
              tabIndex={-1}
              ref={(el) => (optionsRef.current[index] = el)}
              className={`dropdown-option ${
                c.isoCode === country.isoCode ? 'selected' : ''
              }`}
              onClick={() => handleSelect(c)}
              onKeyDown={handleKeyDown}
            >
              {`${c.name} (${c.currency.isoCode} ${c.currency.symbol})`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [text, setText] = useState('Sign up for our newsletter');

  function subscribe(e) {
    e.preventDefault();
    if (!email) {
      setError('please enter a valid email');
      setTimeout(() => {
        setError();
      }, 1500);
      return;
    }

    const payload = {
      data: {
        type: 'subscription',
        attributes: {
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: `${email}`,
              },
            },
          },
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: 'UQazun',
            },
          },
        },
      },
    };

    var requestOptions = {
      mode: 'cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        revision: '2025-04-15',
      },
      body: JSON.stringify(payload),
    };

    fetch(
      'https://a.klaviyo.com/client/subscriptions/?company_id=XnfL7p',
      requestOptions,
    ).then((result) => {
      if (result.ok) {
        setText('Thank you for signing up');
        setTimeout(() => {
          setText('Sign up for our newsletter');
        }, 1500);
      } else {
        result.json().then((data) => {
          console.log(data);
          setError(data.errors[0].detail);
          setTimeout(() => {
            setError();
          }, 1500);
        });
      }
    });
  }

  return (
    <form
      className="footer-newsletter"
      onSubmit={subscribe}
      style={{position: 'relative'}}
    >
      <label>{text}</label>
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Submit</button>
      <p style={{position: 'absolute', bottom: '-1.5rem', fontSize: '12px'}}>
        {error}
      </p>
    </form>
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
