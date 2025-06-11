/**
 * @param {Request} request
 */
export function getLocaleFromRequest(request) {
  const url = new URL(request.url);
  const firstPathPart = url.pathname.split('/')[1]?.toUpperCase() ?? '';

  let pathPrefix = '';
  let [language, country] = ['EN', 'US'];

  if (/^[A-Z]{2}-[A-Z]{2}$/i.test(firstPathPart.replace('.DATA', ''))) {
    pathPrefix = '/' + firstPathPart.replace('.DATA', '');
    [language, country] = firstPathPart.split('-');
  }

  const strippedCountry = country.replace('.DATA', '');

  return {language, country: strippedCountry, pathPrefix};
}

/**
 * @typedef {Object} I18nLocale
 * @property {string} pathPrefix
 */

/** @typedef {import('@shopify/hydrogen').I18nBase} I18nBase */
