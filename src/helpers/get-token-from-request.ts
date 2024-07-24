export async function getTokenFromRequest(request: Request) {
  const accessToken = await request.cookieStore?.get({
    name: 'accessToken',
  });

  return accessToken?.value || null;
}

