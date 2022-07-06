const https = require('https');

async function post(url, data) {
  const dataString = JSON.stringify(data);

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataString, 'utf8'),
    },
    timeout: 3000, // in ms
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return reject(new Error(`HTTP status code ${res.statusCode}`));
      }

      const body = [];
      res.on('data', (chunk) => body.push(chunk));
      res.on('end', () => {
        const resString = Buffer.concat(body).toString();
        resolve(resString);
      });
      return res;
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request time out'));
    });

    req.write(dataString);
    req.end();
  });
}

const cardColors = (params) => {
  // https://gist.github.com/thomasbnt/b6f455e2c7d743b796917fa3c205f812
  const colorTable = {
    createCard: 0x4752b2,
    commentCard: 0x4752b2,
    moveCard: 0x4752b2,
  };

  if (['in review', 'done'].includes(params.listName.toString().toLowerCase())) {
    return 0x2ecc71;
  }

  return colorTable[params.key];
};

const messageBody = (params) => {
  return {
    embeds: [
      {
        color: cardColors(params),
        author: {
          name: 'planka-bot',
        },
        title: params.title,
        description: params.description,
        url: params.url,
        fields: [
          {
            name: 'Project',
            value: params.projectName,
            inline: true,
          },
          {
            name: 'List',
            value: params.listName,
            inline: true,
          },
          {
            name: 'User',
            value: params.userName,
            inline: true,
          },
        ],
        timestamp: new Date(),
        footer: {
          text: 'planka',
        },
      },
    ],
  };
};

module.exports = {
  // sync: true,
  // friendlyName: 'Format welcome message',
  // description: 'Return a personalized greeting based on the provided name.',

  inputs: {
    webhookParams: {
      type: 'json',
      //     example: 'Ami',
      //     description: 'The name of the person to greet.',
      //     required: true
    },
  },

  async fn(inputs, exits) {
    try {
      const bodyObj = messageBody(inputs.webhookParams);
      await post(process.env.DISCORD_WEBHOOK_URL, bodyObj);

      return exits.success();
    } catch (error) {
      return error;
    }
  },
};
