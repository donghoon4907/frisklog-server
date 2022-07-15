import axios from "axios";
import { load } from "cheerio";
import TundownService from "turndown";

import "../module/env";
// import db from "../models";

const VELOG_URL = "https://velog.io";

(async () => {
  console.log(`Execute getVelogData Start at ${new Date()}`);

  try {
    const { data } = await axios.get(VELOG_URL);

    const $ = load(data);

    const $articles = $("main > div").children("div");

    const turndownService = new TundownService();

    $articles.each(async function(index, el) {
      const url = $(el)
        .children("a")
        .attr("href");

      const encodeUrl = encodeURI(url);

      if (url && index === 0) {
        const { data } = await axios.get(VELOG_URL + encodeUrl);

        const $ = load(data);

        const title = $("meta[property=og:title]").attr("content");

        const thumbnail = $("meta[property=og:image]").attr("content");

        const markedTitle = turndownService.turndown(`<h1>${title}</h1>`);

        const markedThumbnail = turndownService.turndown(
          `<img src="${thumbnail}" />`
        );

        // console.log(`${markedTitle} ${markedThumbnail}`);

        const content = $(".atom-one")
          .eq(0)
          .html();

        const markedContent = turndownService.turndown(content);

        console.log(markedContent);
      }
    });
  } catch (e) {
    console.log(e);
  }
})();
