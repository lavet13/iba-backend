import { CookieListItem } from "@whatwg-node/cookie-store";

export const cookieOpts: CookieListItem = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,
  path: '/',
  domain: null,
  expires: null,
};
