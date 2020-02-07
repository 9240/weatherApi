const express = require("express");
const axios = require("axios");
const router = express.Router();
const cheerio = require("cheerio");
const fs = require("fs");
const weatherApiPrefix = "http://localhost:9240";
const weatherApi = [
  weatherApiPrefix + "/baiduURL?wd=",
  weatherApiPrefix + "/soURL?wd=",
  weatherApiPrefix + "/sougou?wd=",
  weatherApiPrefix + "/biying?wd=",
  weatherApiPrefix + "/xinzhi?wd="
];
router.get("/", (req, res, next) => {
  res.render("index", { title: "天气查询" });
});

router.get("/weather", async (req, res, next) => {
  if(!req.query.wd){
    res.json({
      code: 20003,
      msg: "wd参数必填",
      name: "weather"
    })
    return;
  }
  for (let i = 0; i < weatherApi.length; i++) {
    const item = weatherApi[i];
    let flag = false;
    await axios
      .get(item + encodeURI(req.query.wd))
      .then(weather => {
        if (weather.data.code == 10000) {
          fs.appendFile("./log.txt", "\n", err => {
            if (err) {
              console.log(err);
            } else {
              console.log("写入成功");
            }
          });
          res.json(weather.data);
          flag = true;
        } else if (i == weatherApi.length - 1) {
          res.json(weather.data);
        }
      })
      .catch(err => {
        console.log(err);
      });
    if (flag) {
      break;
    }
  }
});

// 百度+中国天气网
router.get("/baiduURL", (req, res, next) => {
  axios.get("https://www.baidu.com").then(broMsg => {
    axios
      .get("https://www.baidu.com/s?wd=" + encodeURI(req.query.wd + "天气"), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36",
          cookie: broMsg.headers["set-cookie"].join(", ")
        }
      })
      .then(baiduRes => {
        const $baidu = cheerio.load(baiduRes.data);
        const baiduURL =
          $baidu(
            "#content_left > div:nth-child(1) > h3.t.c-gap-bottom-small a"
          ).attr("href") || "undefined";
        fs.appendFile(
          "./log.txt",
          "name:baidu" +
            "\n" +
            "time:" +
            new Date() +
            "\n" +
            "text:" +
            $baidu.text().replace(/\s*/g, "") +
            "\n" +
            "url:" +
            baiduURL.replace(/\s*/g, "") +
            "\n",
          err => {
            if (err) {
              console.log(err);
            } else {
              console.log("写入成功");
            }
          }
        );
        if (baiduURL == "undefined") {
          res.json({
            code: 20001,
            msg: "url undefined",
            name: "baidu"
          });
          return;
        }
        axios
          .get(baiduURL)
          .then(weatherRes => {
            const $weather = cheerio.load(weatherRes.data);
            res.json({
              code: 10000,
              msg: {
                today: {
                  tem:
                    $weather("#7d > ul > li:nth-child(1) > p.tem")
                      .text()
                      .trim()
                      .split("/")[1]
                      .split("℃")[0] +
                    "/" +
                    $weather("#7d > ul > li:nth-child(1) > p.tem")
                      .text()
                      .trim()
                      .split("/")[0] +
                    "℃",
                  wea: $weather("#7d > ul > li:nth-child(1) > p.wea")
                    .text()
                    .trim(),
                  win:
                    $weather(
                      "#7d > ul > li:nth-child(1) > p.win > em > span:nth-child(1)"
                    ).attr("title") +
                    " " +
                    $weather(
                      "#7d > ul > li:nth-child(1) > p.win > em > span:nth-child(2)"
                    ).attr("title"),
                  winLevel: $weather("#7d > ul > li:nth-child(1) > p.win")
                    .text()
                    .trim()
                },
                tomorrow: {
                  tem:
                    $weather("#7d > ul > li:nth-child(2) > p.tem")
                      .text()
                      .trim()
                      .split("/")[1]
                      .split("℃")[0] +
                    "/" +
                    $weather("#7d > ul > li:nth-child(2) > p.tem")
                      .text()
                      .trim()
                      .split("/")[0] +
                    "℃",
                  wea: $weather("#7d > ul > li:nth-child(2) > p.wea")
                    .text()
                    .trim(),
                  win:
                    $weather(
                      "#7d > ul > li:nth-child(2) > p.win > em > span:nth-child(1)"
                    ).attr("title") +
                    " " +
                    $weather(
                      "#7d > ul > li:nth-child(2) > p.win > em > span:nth-child(2)"
                    ).attr("title"),
                  winLevel: $weather("#7d > ul > li:nth-child(2) > p.win")
                    .text()
                    .trim()
                }
              },
              name: "baidu"
            });
          })
          .catch(err => {
            res.json({
              code: 20000,
              msg: JSON.stringify(err),
              name: "baidu"
            });
          });
      });
  });
});

// 360+全国天气网
router.get("/soURL", (req, res, next) => {
  axios
    .get("https://www.so.com/s?q=" + encodeURI(req.query.wd + "天气"), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36"
        // Cookie: '__huid=10kqaESxBfjM9iZGYNtgzUqtkW8nlxihEBk0mCTb%2FrCXE%3D'
      }
    })
    .then(soRes => {
      const $so = cheerio.load(soRes.data);
      const soURL =
        $so(
          "#mohe-weather > div > div.mh-tempcont.js-mh-tempcont > h3 > div > a"
        ).attr("href") || "undefined";
      fs.appendFile(
        "./log.txt",
        "name:360" +
          "\n" +
          "time:" +
          new Date() +
          "\n" +
          "text:" +
          $so.text().replace(/\s*/g, "") +
          "\n" +
          "url:" +
          soURL.replace(/\s*/g, "") +
          "\n",
        err => {
          if (err) {
            console.log(err);
          } else {
            console.log("写入成功");
          }
        }
      );
      if (soURL == "undefined") {
        res.json({
          code: 20001,
          msg: "url undefined",
          name: "360"
        });
        return;
      }
      axios
        .get(soURL)
        .then(weatherRes => {
          const $weather = cheerio.load(weatherRes.data);
          if (/http-equiv="refresh"/.test($weather.text())) {
            res.json({
              code: 20002,
              msg: "请再次请求",
              name: "360"
            });
          } else {
            res.json({
              code: 10000,
              msg: {
                today: {
                  tem: $weather(
                    "#china-weather > div.weather-header-wrap.weather-bg-normal > div > div.weather-forcast-wrap > div.weather-card-wrap > div > ul:nth-child(1) > li > div:nth-child(5)"
                  ).text(),
                  wea: $weather(
                    "#china-weather > div.weather-header-wrap.weather-bg-normal > div > div.weather-forcast-wrap > div.weather-card-wrap > div > ul:nth-child(1) > li > div:nth-child(4)"
                  )
                    .text()
                    .trim(),
                  win: $weather(
                    "#china-weather > div.weather-header-wrap.weather-bg-normal > div > div.weather-forcast-wrap > div.weather-card-wrap > div > ul:nth-child(1) > li > div"
                  )
                    .last()
                    .text()
                    .split(" ")[0],
                  winLevel: $weather(
                    "#china-weather > div.weather-header-wrap.weather-bg-normal > div > div.weather-forcast-wrap > div.weather-card-wrap > div > ul:nth-child(1) > li > div"
                  )
                    .last()
                    .text()
                    .split(" ")[1]
                },
                tomorrow: {
                  tem: $weather(
                    "#china-weather > div.weather-header-wrap.weather-bg-normal > div > div.weather-forcast-wrap > div.weather-card-wrap > div > ul:nth-child(2) > li > div:nth-child(5)"
                  ).text(),
                  wea: $weather(
                    "#china-weather > div.weather-header-wrap.weather-bg-normal > div > div.weather-forcast-wrap > div.weather-card-wrap > div > ul:nth-child(2) > li > div:nth-child(4)"
                  )
                    .text()
                    .trim(),
                  win: $weather(
                    "#china-weather > div.weather-header-wrap.weather-bg-normal > div > div.weather-forcast-wrap > div.weather-card-wrap > div > ul:nth-child(2) > li > div"
                  )
                    .last()
                    .text()
                    .split(" ")[0],
                  winLevel: $weather(
                    "#china-weather > div.weather-header-wrap.weather-bg-normal > div > div.weather-forcast-wrap > div.weather-card-wrap > div > ul:nth-child(2) > li > div"
                  )
                    .last()
                    .text()
                    .split(" ")[1]
                }
              },
              name: "360"
            });
          }
        })
        .catch(err => {
          res.json({
            code: 20000,
            msg: JSON.stringify(err),
            name: "360"
          });
        });
    });
});

// 搜狗+中国天气网
router.get("/sougou", (req, res, next) => {
  // axios.get("https://www.sogou.com/").then(broMsg => {
  axios
    .get(
      "https://www.sogou.com/web?query=" + encodeURI(req.query.wd + "天气")
      // {
      //   headers: {
      //     "User-Agent":
      //       "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36",
      //     cookie: broMsg.headers["set-cookie"].join(", ")
      //   }
      // }
    )
    .then(sougouRes => {
      const $sougou = cheerio.load(sougouRes.data);
      console.log($sougou(".vrwrap h3.vrTitle")[0].children[0].attribs?$sougou(".vrwrap h3.vrTitle")[0].children[0].attribs.href:"undefined")
      const sougouURL = $sougou(".vrwrap h3.vrTitle")[0].children[0].attribs?$sougou(".vrwrap h3.vrTitle")[0].children[0].attribs.href:"undefined";
      fs.appendFile(
        "./log.txt",
        "name:sougou" +
          "\n" +
          "time:" +
          new Date() +
          "\n" +
          "text:" +
          $sougou.text().replace(/\s*/g, "") +
          "\n" +
          "url:" +
          sougouURL.replace(/\s*/g, "") +
          "\n",
        err => {
          if (err) {
            console.log(err);
          } else {
            console.log("写入成功");
          }
        }
      );
      if (sougouURL == "undefined") {
        res.json({
          code: 20001,
          msg: "url undefined",
          name: "sougou"
        });
        return;
      }
      axios
        .get(sougouURL)
        .then(weatherRes => {
          const $weather = cheerio.load(weatherRes.data);
          res.json({
            code: 10000,
            msg: {
              today: {
                tem:
                  $weather("#7d > ul > li:nth-child(1) > p.tem")
                    .text()
                    .trim()
                    .split("/")[1]
                    .split("℃")[0] +
                  "/" +
                  $weather("#7d > ul > li:nth-child(1) > p.tem")
                    .text()
                    .trim()
                    .split("/")[0] +
                  "℃",
                wea: $weather("#7d > ul > li:nth-child(1) > p.wea")
                  .text()
                  .trim(),
                win:
                  $weather(
                    "#7d > ul > li:nth-child(1) > p.win > em > span:nth-child(1)"
                  ).attr("title") +
                  " " +
                  $weather(
                    "#7d > ul > li:nth-child(1) > p.win > em > span:nth-child(2)"
                  ).attr("title"),
                winLevel: $weather("#7d > ul > li:nth-child(1) > p.win")
                  .text()
                  .trim()
              },
              tomorrow: {
                tem:
                  $weather("#7d > ul > li:nth-child(2) > p.tem")
                    .text()
                    .trim()
                    .split("/")[1]
                    .split("℃")[0] +
                  "/" +
                  $weather("#7d > ul > li:nth-child(2) > p.tem")
                    .text()
                    .trim()
                    .split("/")[0] +
                  "℃",
                wea: $weather("#7d > ul > li:nth-child(2) > p.wea")
                  .text()
                  .trim(),
                win:
                  $weather(
                    "#7d > ul > li:nth-child(2) > p.win > em > span:nth-child(1)"
                  ).attr("title") +
                  " " +
                  $weather(
                    "#7d > ul > li:nth-child(2) > p.win > em > span:nth-child(2)"
                  ).attr("title"),
                winLevel: $weather("#7d > ul > li:nth-child(2) > p.win")
                  .text()
                  .trim()
              }
            },
            name: "sougou"
          });
        })
        .catch(err => {
          res.json({
            code: 20000,
            msg: JSON.stringify(err),
            name: "sougou"
          });
        });
    });
  // });
});

// 必应+中国天气网
router.get("/biying", (req, res, next) => {
  axios.get("https://cn.bing.com/").then(broMsg => {
    axios
      .get("https://cn.bing.com/search?q=" + encodeURI(req.query.wd + "天气"), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36",
          cookie: broMsg.headers["set-cookie"].join(", ")
        }
      })
      .then(biyingRes => {
        const $biying = cheerio.load(biyingRes.data);
        const biyingURLS = $biying("#b_results>.b_algo>h2");
        var biyingURL;
        Array.from(biyingURLS).forEach(item => {
          if (/中国天气网$/.test($biying(item.children).text())) {
            biyingURL = $biying(item.children)[0].attribs.href;
          }
        });
        console.log(biyingURL)
        fs.appendFile(
          "./log.txt",
          "name:biying" +
            "\n" +
            "time:" +
            new Date() +
            "\n" +
            "text:" +
            $biying.text().replace(/\s*/g, "") +
            "\n" +
            "url:" +
            biyingURL +
            "\n",
          err => {
            if (err) {
              console.log(err);
            } else {
              console.log("写入成功");
            }
          }
        );
        if (biyingURL == undefined) {
          res.json({
            code: 20001,
            msg: "url undefined",
            name: "biying"
          });
          return;
        }
        axios
          .get(biyingURL)
          .then(weatherRes => {
            const $weather = cheerio.load(weatherRes.data);
            res.json({
              code: 10000,
              msg: {
                today: {
                  tem:
                    $weather("#7d > ul > li:nth-child(1) > p.tem")
                      .text()
                      .trim()
                      .split("/")[1]
                      .split("℃")[0] +
                    "/" +
                    $weather("#7d > ul > li:nth-child(1) > p.tem")
                      .text()
                      .trim()
                      .split("/")[0] +
                    "℃",
                  wea: $weather("#7d > ul > li:nth-child(1) > p.wea")
                    .text()
                    .trim(),
                  win:
                    $weather(
                      "#7d > ul > li:nth-child(1) > p.win > em > span:nth-child(1)"
                    ).attr("title") +
                    " " +
                    $weather(
                      "#7d > ul > li:nth-child(1) > p.win > em > span:nth-child(2)"
                    ).attr("title"),
                  winLevel: $weather("#7d > ul > li:nth-child(1) > p.win")
                    .text()
                    .trim()
                },
                tomorrow: {
                  tem:
                    $weather("#7d > ul > li:nth-child(2) > p.tem")
                      .text()
                      .trim()
                      .split("/")[1]
                      .split("℃")[0] +
                    "/" +
                    $weather("#7d > ul > li:nth-child(2) > p.tem")
                      .text()
                      .trim()
                      .split("/")[0] +
                    "℃",
                  wea: $weather("#7d > ul > li:nth-child(2) > p.wea")
                    .text()
                    .trim(),
                  win:
                    $weather(
                      "#7d > ul > li:nth-child(2) > p.win > em > span:nth-child(1)"
                    ).attr("title") +
                    " " +
                    $weather(
                      "#7d > ul > li:nth-child(2) > p.win > em > span:nth-child(2)"
                    ).attr("title"),
                  winLevel: $weather("#7d > ul > li:nth-child(2) > p.win")
                    .text()
                    .trim()
                }
              },
              name: "biying"
            });
          })
          .catch(err => {
            res.json({
              code: 20000,
              msg: JSON.stringify(err),
              name: "biying"
            });
          });
      });
  });
});

// 心知天气
router.get("/xinzhi", (req, res, next) => {
  fs.appendFile(
    "./log.txt",
    "name:xinzhi" +
      "\n" +
      "time:" +
      new Date() +
      "\n" +
      "text:" +
      req.query.wd +
      "\n" +
      "url:" +
      "https://api.seniverse.com/v3/weather/daily.json?key=jskjsmnsraqqhiaw&location=" +
      encodeURI(req.query.wd) +
      "&language=zh-Hans&unit=c&start=0&days=2" +
      "\n",
    err => {
      if (err) {
        console.log(err);
      } else {
        console.log("写入成功");
      }
    }
  );
  axios
    .get(
      "https://api.seniverse.com/v3/weather/daily.json?key=jskjsmnsraqqhiaw&location=" +
        encodeURI(req.query.wd) +
        "&language=zh-Hans&unit=c&start=0&days=2"
    )
    .then(weatherRes => {
      var data = weatherRes.data.results[0].daily;
      res.json({
        code: 10000,
        path: weatherRes.data.results[0].location.path,
        msg: {
          today: {
            tem: data[0].low + "/" + data[0].high + "℃",
            wea: data[0].text_day,
            win: data[0].wind_direction,
            winLevel: data[0].wind_scale
          },
          tomorrow: {
            tem: data[1].low + "/" + data[1].high + "℃",
            wea: data[1].text_day,
            win: data[1].wind_direction,
            winLevel: data[1].wind_scale
          }
        },
        name: "zhixin"
      });
    })
    .catch(err => {
      res.json({
        code: 20004,
        msg: err.response.data.status,
        name: "zhixin"
      });
    });
});

module.exports = router;
