import {Suspense, useId, useState} from 'react';
import {Await, NavLink, useAsyncValue} from '@remix-run/react';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import logo from '../assets/Group 196.png';
import search from '../assets/search.png';
import bag from '../assets/bag.png';
import acct from '../assets/acct.png';
import {motion, AnimatePresence} from 'motion/react';
import Expandable from './Expandable';
import {useEffect} from 'react';
import {SearchFormPredictive} from './SearchFormPredictive';

/**
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, publicStoreDomain}) {
  const {shop, menu} = header;

  return (
    <header className="header">
      <div className="header-inner">
        <HeaderMenu
          menu={menu}
          viewport="desktop"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
        <NavLink prefetch="intent" to="/" className="header-logo">
          <img src={logo} alt={`${shop.name} logo`} />
        </NavLink>
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>
    </header>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();

  const [open, setOpen] = useState();
  const toggleSection = (section) => {
    setOpen(open === section ? null : section);
  };

  const [openNested, setOpenNested] = useState();
  const toggleSectionNested = (section) => {
    setOpenNested(openNested === section ? null : section);
  };

  useEffect(() => {
    setOpenNested();
  }, [open]);
  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          style={activeLinkStyle}
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return item.items.length > 0 ? (
          <Dropdown
            label={item.title}
            key={item.id}
            toggleIsOpen={toggleSection}
            isOpen={open === item.title}
          >
            {item.items.map((item2) => {
              if (!item2.url) return null;

              // if the url is internal, we strip the domain
              const url =
                item2.url.includes('myshopify.com') ||
                item2.url.includes(publicStoreDomain) ||
                item2.url.includes(primaryDomainUrl)
                  ? new URL(item2.url).pathname
                  : item2.url;

              return item2.items.length > 0 ? (
                <Expandable
                  key={item2.id}
                  title={item2.title}
                  parent={item.title}
                  openSection={openNested}
                  toggleSection={toggleSectionNested}
                  header={true}
                  details={item2.items.map((item3) => {
                    const url =
                      item3.url.includes('myshopify.com') ||
                      item3.url.includes(publicStoreDomain) ||
                      item3.url.includes(primaryDomainUrl)
                        ? new URL(item3.url).pathname
                        : item3.url;
                    return (
                      <NavLink
                        className="header-menu-item"
                        end
                        key={item3.id}
                        onClick={close}
                        prefetch="intent"
                        style={activeLinkStyle}
                        to={url}
                      >
                        {item3.title}
                      </NavLink>
                    );
                  })}
                />
              ) : (
                <NavLink
                  className="header-menu-item"
                  end
                  key={item.id}
                  onClick={close}
                  prefetch="intent"
                  style={activeLinkStyle}
                  to={url}
                >
                  {item2.title}
                </NavLink>
              );
            })}
          </Dropdown>
        ) : (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function Dropdown({children, label, displaySVG, toggleIsOpen, isOpen}) {
  return (
    <button
      className={`mobile-filter ${isOpen ? 'isOpen-btn' : ''} header-mf header-menu-item`}
      onClick={() => toggleIsOpen(label)}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={`filt-by-${isOpen}`}
          initial={{opacity: 1}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          style={{display: 'inline-block', textAlign: 'left'}}
        >
          {label}
        </motion.span>
      </AnimatePresence>
      {displaySVG ? (
        <motion.svg
          width="8"
          height="4"
          viewBox="0 0 8 4"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial={{rotate: 0}}
          animate={{rotate: isOpen ? '180deg' : 0}}
          transition={{ease: 'easeInOut', duration: 0.15}}
        >
          <path
            d="M7.82391 0.152959C7.71112 0.0550192 7.55817 -4.38211e-07 7.39869 -4.24269e-07C7.23921 -4.10327e-07 7.08626 0.0550192 6.97348 0.152959L3.99637 2.73897L1.01926 0.15296C0.905829 0.0577954 0.753904 0.00513784 0.59621 0.00632804C0.438515 0.00751848 0.287667 0.0624613 0.176156 0.159324C0.064645 0.256186 0.00139348 0.387217 2.30612e-05 0.524196C-0.00134688 0.661175 0.0592744 0.79314 0.168831 0.891671L3.57115 3.84704C3.68394 3.94498 3.83689 4 3.99637 4C4.15585 4 4.3088 3.94498 4.42158 3.84704L7.82391 0.891671C7.93666 0.793701 8 0.660844 8 0.522315C8 0.383786 7.93666 0.250929 7.82391 0.152959Z"
            fill="black"
          />
        </motion.svg>
      ) : null}

      <AnimatePresence>
        {isOpen && (
          <div className="sort-overflow-hidden-container header-sohc">
            <motion.div
              initial={{y: '-100%'}}
              animate={{y: '1px'}}
              exit={{y: '-100%'}}
              transition={{ease: 'easeInOut', duration: 0.15}}
            >
              <div className="sort-container header-s-c">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </button>
  );
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function HeaderCtas({isLoggedIn, cart}) {
  return (
    <nav className="header-ctas" role="navigation">
      <HeaderMenuMobileToggle />
      <SearchToggle />
      <NavLink
        prefetch="intent"
        to="/account"
        style={(activeLinkStyle, {display: 'flex'})}
        // style={}
      >
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            <img src={acct} alt="Cart" className="header-icon" />
          </Await>
        </Suspense>
      </NavLink>

      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <h3>☰</h3>
    </button>
  );
}

function SearchToggle() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  // const {open} = useAside();
  const queriesDatalistId = useId();
  return (
    <>
      <SearchFormPredictive>
        {({fetchResults, goToSearch, inputRef}) => (
          <>
            <input
              name="q"
              value={value}
              onChange={(e) => {
                console.log(e.target.value);
                setValue(e.target.value);
                fetchResults(e);
              }}
              onFocus={fetchResults}
              placeholder="Search"
              ref={inputRef}
              type="search"
              list={queriesDatalistId}
              style={{
                transform: open ? 'translateX(0)' : 'translateX(100%)',
                transition: 'all 150ms ease-in-out',
              }}
            />
            {/* <button onClick={goToSearch}>Search</button> */}
            <button
              style={{display: 'flex', padding: '0', background: 'white'}}
              className="reset"
              onClick={() => {
                if (!value) {
                  if (open) setOpen(false);
                  else {
                    setOpen(true);
                    setTimeout(() => inputRef.current.focus(), 150);
                  }
                } else {
                  goToSearch();
                  setValue();
                  setOpen(false);
                }
              }}
            >
              <img src={search} className="header-icon" />
            </button>
          </>
        )}
      </SearchFormPredictive>
    </>
  );
}

/**
 * @param {{count: number | null}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      style={{display: 'flex'}}
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      <img src={bag} alt="Cart" className="header-icon" />
    </a>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
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
    fontWeight: isActive ? 'normal' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
