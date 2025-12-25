export default function handler(req, res) {
  const { host } = req.headers;
  const clientID = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `https://${host}/api/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientID}&scope=repo,user&redirect_uri=${redirectUri}`;
  res.redirect(url);
}