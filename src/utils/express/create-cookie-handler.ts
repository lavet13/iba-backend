import { CookieStore, getCookieString } from '@whatwg-node/cookie-store';
import { Request, Response } from 'express';

export function createCookieHandler(req: Request, res: Response) {
  const cookieStore = new CookieStore(req.headers.cookie ?? '');
  const cookieStrings: string[] = [];

  cookieStore.onchange = function ({ changed, deleted }) {
    changed.forEach(cookie => {
      cookieStrings.push(getCookieString(cookie));
    });
    deleted.forEach(cookie => {
      cookieStrings.push(getCookieString({ ...cookie, value: undefined }));
    });
  };

  return {
    cookieStore,
    applyChanges: () => {
      cookieStrings.forEach(cookieString => {
        res.setHeader('Set-Cookie', cookieString);
      });
    }
  };
}
