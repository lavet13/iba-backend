import { CookieListItem } from "@whatwg-node/cookie-store";

export const cookieOpts: CookieListItem = {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
  path: '/',
  domain: null,
  expires: null,
};
