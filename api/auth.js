module.exports = (req, res) => {
  const { host } = req.headers;
  const clientID = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `https://${host}/api/callback`;
  
  if (!clientID) {
      return res.status(500).send("Error: GITHUB_CLIENT_ID is missing in Vercel settings.");
  }

  const url = `https://github.com/login/oauth/authorize?client_id=${clientID}&scope=repo,user&redirect_uri=${redirectUri}`;
  res.redirect(url);
};
