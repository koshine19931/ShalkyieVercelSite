import axios from 'axios';

export default async function handler(req, res) {
  const { code } = req.query;
  const { host } = req.headers;
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: { Accept: 'application/json' }
    });

    const { access_token } = response.data;
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
    res.status(500).send(error.message);
  }
}