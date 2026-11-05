import { kWsToken } from './http-authentication.js';

function generateHtmlIndex(clientConfig) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no">
    <meta name="theme-color" content="#000000">

    <title>
      ${clientConfig.app.name} | ${clientConfig.role}
    </title>

    <script>
      window.SOUNDWORKS_CONFIG = JSON.parse('${JSON.stringify(clientConfig)}');
    </script>
    <script defer src="${clientConfig.env.baseUrl ? `/${clientConfig.env.baseUrl}` : ''}/build/${clientConfig.role}.js"></script>

    <link rel="stylesheet" href="${clientConfig.env.baseUrl ? `/${clientConfig.env.baseUrl}` : ''}/build/css/app.css">
  </head>

  <body class="loading ${clientConfig.role}"></body>
</html>
  `;
}

function getClientConfig(clientRole, serverConfig) {
  // Filter out config that are not needed by the clients, such as password
  // defined in `config.env`
  const clientConfig = {
    role: clientRole,
    app: {
      name: serverConfig.app.name,
      author: serverConfig.app.author,
    },
    env: {
      type: serverConfig.env.type,
      useHttps: serverConfig.env.useHttps,
      serverAddress: serverConfig.env.serverAddress,
      port: serverConfig.env.port,
      baseUrl: serverConfig.env.baseUrl,
    },
  };

  // Pass every other config information added on the application side.
  // This may be required to e.g. configure a plugin on the client side before
  // we can create a shared state that contains the information
  // (cf. set `randomize` option depending on a project configuration file in
  // the position plugin
  for (let name in serverConfig) {
    if (name !== 'app' && name !== 'env') {
      clientConfig[name] = serverConfig[name];
    }
  }

  return clientConfig;
}

export const clientIndex = (clientRole, serverConfig) => {
  return (_req, res) => {
    const clientConfig = getClientConfig(clientRole, serverConfig);
    // if the client has gone through the connection middleware and succeeded, add the token
    // to the data object, so that the client can send it back on websocket connection
    if (res[kWsToken]) {
      clientConfig.token = res[kWsToken];
    }

    const htmlIndex = generateHtmlIndex(clientConfig);

    res.end(htmlIndex);
  };
};
