import {Suspense} from 'react';
import {Await, NavLink} from '@remix-run/react';
import logo from '../assets/Group 196.png';
import gila from '../assets/Gila-Black.png';

/**
 * @param {FooterProps}
 */
export function Footer({footer: footerPromise, header, publicStoreDomain}) {
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
                  {/* Add more if needed */}
                </select>
              </div>
              <div className="footer-center">
                {[0, 1, 2].map((colIndex) => (
                  <div className="footer-menu-column" key={colIndex}>
                    {footer?.menu &&
                      header.shop.primaryDomain?.url &&
                      footer.menu.items
                        .slice(
                          Math.floor((colIndex * footer.menu.items.length) / 3),
                          Math.floor(
                            ((colIndex + 1) * footer.menu.items.length) / 3,
                          ),
                        )
                        .map((item) => {
                          if (!item.url) return null;

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
                            <NavLink
                              end
                              key={item.id}
                              prefetch="intent"
                              to={url}
                            >
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
          </footer>
        )}
      </Await>
    </Suspense>
  );
}
/**
 * @param {{
 *   menu: FooterQuery['menu'];
 *   primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
 *   publicStoreDomain: string;
 * }}
 */
function FooterMenu({menu, primaryDomainUrl, publicStoreDomain}) {
  return (
    <nav className="footer-menu" role="navigation">
      {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
        if (!item.url) return null;
        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        const isExternal = !url.startsWith('/');
        return isExternal ? (
          <a href={url} key={item.id} rel="noopener noreferrer" target="_blank">
            {item.title}
          </a>
        ) : (
          <NavLink end key={item.id} prefetch="intent" to={url}>
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};

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
