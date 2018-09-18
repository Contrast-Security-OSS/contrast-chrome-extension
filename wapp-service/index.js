// const Wappalyzer = require('wappalyzer');
// const express    = require('express');
// const app        = express();
//
// app.use(express.json());
//
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
//   res.header('Access-Control-Allow-Methods', 'GET');
//
//   next();
// });
//
// app.get("/", (req, res) => {
//   const { site } = req.query;
//   const options  = {
//     debug: true,
//     delay: 500,
//     maxDepth: 4,
//     maxUrls: 20,
//     maxWait: 10000,
//     recursive: true,
//     userAgent: 'Wappalyzer',
//   };
//
//   if (!site.includes("http://") && !site.includes("https://")) {
//     if (site.includes("localhost")) {
//       site = "http://" + site
//     } else {
//       site = "https://" + site
//     }
//   }
//
//   const wappalyzer = new Wappalyzer(site, options);
//   wappalyzer.analyze()
//   .then(libraries => {
//     res.status(200).send({
//       success: true,
//       message: "Success",
//       libraries,
//     });
//   })
//   .catch(error => {
//     res.status(422).send({
//       success: false,
//       message: error.toString(),
//       libraries: null,
//     });
//   })
// });
//
// const port = process.env.WAPP_PORT || 5203;
// app.listen(port, console.log("Wappalyzer service started on port " + port));
