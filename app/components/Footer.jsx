import {Suspense, useEffect, useState} from 'react';
import {Await, NavLink} from '@remix-run/react';
import logo from '../assets/Group 196.png';
import gila from '../assets/Gila-Black.png';

/**
 * @param {FooterProps}
 */
export function Footer({footer: footerPromise, header, publicStoreDomain}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 499);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Suspense>
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
                <select className="footer-locale">
                  <option>United States (USD $)</option>
                </select>
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
