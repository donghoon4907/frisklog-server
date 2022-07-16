import axios from "axios";
import { load } from "cheerio";
import TundownService from "turndown";

import "../module/env";
import db from "../models";

export const workVelogPostCrawling = async () => {
  let success = false;

  try {
    const { id, domainUrl } = await db.Platform.findOne({
      where: { platformName: "velog" }
    });
    // 메인 페이지 요청
    const { data } = await axios.get(domainUrl);

    const $ = load(data);

    const $articles = $("main > div").children("div");

    const turndownService = new TundownService();

    for (let i = 0; i < $articles.length - 1; i++) {
      const $article = $articles.eq(i);

      const url = $article.children("a").attr("href");

      const encodeUrl = encodeURI(url);

      if (url) {
        // 상세 페이지 요청
        const { data } = await axios.get(domainUrl + encodeUrl);
        // 크롤링 인스턴스
        const { getCategory, getContent, getUser } = new VelogPostCrawling(
          data
        );

        const velogUser = getUser();
        // 사용자 입수 작업
        let user = await db.User.findOne({
          where: { nickname: velogUser.nickname, PlatformId: id }
        });

        if (user === null) {
          user = await db.User.create({ ...velogUser, PlatformId: id });

          console.log(`Created velog user ${user.id}`);
        }

        // markup => markdown
        const markedContent = turndownService.turndown(getContent());

        const category = getCategory();
        // 포스트 입수 작업
        const post = await db.Post.findOne({ where: { link: encodeUrl } });

        if (post === null) {
          await db.Post.create({
            content: markedContent,
            category,
            link: encodeUrl,
            UserId: user.id
          });
          console.log(`Created velog user ${user.id}'s post`);
        } else {
          await post.update({
            content: markedContent,
            category
          });
          console.log(`Updated velog user ${user.id}'s post`);
        }
      }
    }

    success = true;
  } catch (e) {
    console.log(e);

    success = false;
  }

  return success;
};

export class VelogPostCrawling {
  constructor(html) {
    this.$ = load(html);

    this.headerSelector = ".head-wrapper";

    this.titleSelector = "meta[property=og:title]";

    this.thumbnailSelector = "meta[property=og:image]";

    this.markdownSelector = ".atom-one";
  }

  getCategory = () => {
    const { $, headerSelector } = this;

    const $headerColumns = $(headerSelector).children();

    const $categorys = $headerColumns.eq(2).children();

    let category = [];
    $categorys.each(function(index, el) {
      category.push($(el).text());
    });

    return category.join(",");
  };

  getTitle = () => {
    const { $, titleSelector } = this;

    const $title = $(titleSelector);

    return `<h1>${$title.attr("content")}</h1>`;
  };

  getThumbnail = () => {
    const { $, thumbnailSelector } = this;

    const $thumbnail = $(thumbnailSelector);

    return `<img src='${$thumbnail.attr("content")}' />`;
  };

  getContent = () => {
    const { $, markdownSelector, getTitle, getThumbnail } = this;

    const $contentWrap = $(markdownSelector).eq(0);

    const title = getTitle();

    const thumbnail = getThumbnail();

    return title + thumbnail + $contentWrap.html();
  };

  getEmail = $wrap => {
    const { $ } = this;

    const $container = $wrap.parent();

    const $toolbarWrap = $container.children().eq(2);

    const $toolbarItems = $toolbarWrap.children();

    let email = null;
    $toolbarItems.each(function(_, el) {
      const $svg = $(el).find("svg");

      if ($svg.attr("data-testid") === "email") {
        const href = $svg.parent().attr("href");

        email = href.split(":")[1];

        return false;
      }
    });

    return email;
  };

  makeAvatarUrl = avatar => {
    const splitAvatar = avatar.split("/");

    return `/${splitAvatar.slice(3).join("/")}`;
  };

  getUser = () => {
    const { $, getEmail, makeAvatarUrl } = this;

    const $imgs = $("img");

    const user = {};
    $imgs.each(function(_, el) {
      const alt = $(el).attr("alt");

      if (alt === "profile") {
        const $wrap = $(el).closest("div");

        const $name = $wrap.find(".name > a");

        user.link = $name.attr("href");

        user.nickname = $name.text();

        user.email = getEmail($wrap);

        const src = $(el).attr("src");

        user.avatar = makeAvatarUrl(src);

        return false;
      }
    });

    return user;
  };
}
