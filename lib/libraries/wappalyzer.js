// /*global
// 	chrome,
// */
//
// import { WAPPALYZER_SERVICE } from "../util.js";
//
// const wappalzye = async tab => {
//   const tabURL = new URL(tab.url);
//   const response = await fetch(WAPPALYZER_SERVICE + "?site=" + tabURL.href);
//   if (response.ok && response.status === 200) {
//     const json = await response.json();
//     if (json.success) {
//       return json.libraries.applications;
//     }
//     return null;
//   }
//   // console.log("ERROR IN WAPPALYZE RESPONSE", response);
//   return null;
// };
//
// export { wappalzye };
"use strict";