import {
  Link as RemixLink,
  NavLink as RemixNavLink,
  useMatches,
} from '@remix-run/react';

export default function NavLink(props) {
  const {to, className, ...resOfProps} = props;
  const [root] = useMatches();
  const selectedLocale = root.data.selectedLocale;

  let toWithLocale = to;

  if (typeof to === 'string') {
    toWithLocale = selectedLocale ? `${selectedLocale.pathPrefix}${to}` : to;
  }

  if (typeof className === 'function') {
    return (
      <RemixNavLink to={toWithLocale} className={className} {...resOfProps} />
    );
  }

  return (
    <RemixNavLink to={toWithLocale} className={className} {...resOfProps} />
  );
}
