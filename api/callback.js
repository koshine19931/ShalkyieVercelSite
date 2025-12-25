const axios = require('axios');

module.exports = async (req, res) => {
  const { code } = req.query;
  
  // 1. Check if Secrets exist
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(500).send("Error: Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in Vercel settings.");
  }

  try {
    // 2. Exchange Code for Token
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: { Accept: 'application/json' },
    });

    const { access_token } = response.data;

    if (!access_token) {
        return res.status(400).send("GitHub Error: Could not get access token. Check your Client Secret.");
    }

    // 3. Send Token back to CMS
    const script = `
      <script>
        (function() {
          function receiveMessage(e) {
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({ token: access_token, provider: "github" })}',
              e.origin
            );
          }
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        })()
      </script>
    `;
    res.send(script);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};
