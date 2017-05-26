let express = require("express");
let Sequelize = require("sequelize");
let bodyParser = require("body-parser");
let shortUrl = require("./shorturl");

let app = express();

let Url, ShortUrl;
// setup a new database
// using database credentials set in .env
var sequelize = new Sequelize(
  "database",
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: "0.0.0.0",
    dialect: "sqlite",
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    storage: ".data/database.sqlite"
  }
);

// authenticate with the database
sequelize
  .authenticate()
  .then(function(err) {
    console.log("Connection has been established successfully.");
    // define a new table 'urls'
    Url = sequelize.define(
      "urls",
      {
        originalUrl: {
          type: Sequelize.STRING(255)
        },
        shortUrl: {
          type: Sequelize.STRING(32)
        }
      },
      {
        createdAt: false,
        updatedAt: false
      }
    );

    // reinitialize the app on every run .. all records are lost
    sequelize.sync({ force: true }).then(()=>{runApp()});

  })
  .catch(function(err) {
    console.log("Unable to connect to the database: ", err);
  });

const isUrl = str => {
  var pattern = new RegExp(
    "^(https?:\\/\\/)" + // protocol
    "(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}" + // domain name
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%\ _.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return pattern.test(str);
};

const runApp = () => {
  app.use(bodyParser.urlencoded({extended: true}));

  app.get("/list", function(request, response) {
    let urlList = [];
    Url.findAll().then(function(urls) {
      response.send(JSON.stringify(urls));
    });
  });

  app.get("/*", function(request, response) {
    let inUrl = request.query.url;

    if (inUrl) {
      if (isUrl(inUrl)) {
        let t = new Date().getTime() - new Date("2017-01-01").getTime();
        Url.findOrCreate({
          where: { originalUrl: inUrl },
          defaults: { shortUrl: shortUrl.create(t) }
        }).spread((url, created) => {
          let surl = url.get({ plain: true }).shortUrl;
          response.send(
            JSON.stringify({
              original_url: inUrl,
              short_url: request.headers.host + "/" + surl
            })
          );
        });
      } else {
        response.status(500).send("Invalid url");
      }
      return;
    }

    let urlCode = request.params[0];

    if (!urlCode) {
      //show instructions
      let html =
        "<html><head><title>URL shortener</title>" +
        "<style>code {color: darkred; background-color: #FEE;}</style>" +
        "</head>" +
        "<body>" +
        "<h1>URL shortener</h1>" +
        "<h2>To create a short url, call:</h2>" +
        "<p><code>" +
        request.headers.host +
        "/?url=http://example.com</code></p>" +
        "<h2>Output</h2>" +
        '<p><code>{"original_url":"http://example.com", "short_url":"' +
        request.headers.host +
        '/cbsn"}</code></p>' +
        "<h2>To use:</h2>" +
        "<p>Load <code>" +
        request.headers.host +
        "/cbsn</code> on your browser</p>" +
        "<p> will redirect to <code>http://www.example.com</code></p>" +
        "<br/><br/><br/><p><strong>Note:</strong>The database is reinitialized when server starts.</p>"+
        "</body></html>";
      response.status(200).send(html);
      return;
    }

    if (urlCode.length > 16) {
      response.status(500).send("Invalid");
      return;
    }

    // could be a short url .. check db for a hit
    Url.findOne({
      attributes: ["originalUrl"],
      where: { shortUrl: urlCode }
    }).then(url => {
      if (url) {
        response.redirect(url.originalUrl);
      } else {
        response.status(500).send("Not found");
      }
    });
  });

  let listener = app.listen(process.env.PORT || 5000, function() {
    console.log("App is listening on port " + listener.address().port);
  });
};
