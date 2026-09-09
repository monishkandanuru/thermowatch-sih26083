export function GET(request: Request) {
  return Response.redirect(
    new URL('/signin-with-chatgpt?return_to=/', request.url),
    302,
  );
}
