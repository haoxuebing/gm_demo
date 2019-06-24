var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var gm = require('gm');
var puppeteer = require('puppeteer');
var os = require('os');
var cuid = require('cuid');
// var fs = require('fs');


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('upload', {
    title: '图片缩略图'
  });
});

router.post('/imgUpload', function (req, res) {
  var form = new multiparty.Form(); //新建表单
  //设置编辑
  form.encoding = 'utf-8';
  //设置文件存储路径
  form.uploadDir = "./temp/";
  form.parse(req, (err, fields, files) => {
    console.log(fields, files);
    let file = files['img'][0]; //获取bolb文件
    // console.log(file.path.substring(file.path.lastIndexOf('.')) + '\n' + file.path)

    gm(file.path).size(function (err, value) {
      console.log(err || value)
    });

    gm(file.path)
      .resize(150, 150, '!') //加('!')强行把图片缩放成对应尺寸150*150！
      .write('public/images/' + file.originalFilename, function (err) {
        if (err) {
          console.log(err);
          res.send(JSON.stringify(err));
        } else {
          res.header("Content-Type", "image/jpeg");
          res.sendFile(process.cwd() + '/public/images/' + file.originalFilename)
        }
      });



  });

})



router.get('/robot', function (req, res) {
  res.render('robot', {
    title: '网页快照'
  });
})


router.post('/robot', async function (req, res) {
  let request_url = req.body.url.indexOf('http') > -1 ? req.body.url : ('http://' + req.body.url)
  console.log('正在截取网页：' + request_url)
  let localpath = 'temp/' + cuid() + '.png'
  let timeoutMillSeconds = 10000;
  let waitUntilStr = 'domcontentloaded';
  let system_warn = 1002; // 系统提示/告警

  let browser = await puppeteer.launch({
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    timeout: 30000,
    ignoreHTTPSErrors: true,
    headless: true, // os.type().toLocaleLowerCase() == 'linux' ? true : false, // config.puppeteer.linux,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let page = await browser.newPage();

  await page.goto(request_url, {
    timeout: timeoutMillSeconds,
    waitUntil: waitUntilStr
  }).catch(err => console.log(err));

  let height_limit = false;
  let scroll_times = 0;
  let mValues = {
    'scrollEnable': true,
    'height_limit': height_limit,
    'times': 10
  };
  let result_map = new Map();

  try {
    // await page.waitFor(5000);

    while (mValues.scrollEnable) {
      mValues = await page.evaluate((max_height_px,
        page_screentshot_height_limit,
        height_limit,
        result_map,
        system_warn,
        request_url,
        scroll_times
      ) => {

        let times = 1;
        let scrollEnable = true;
        if (undefined !== document.body && null != document.body) {
          window.scrollBy(0, window.innerHeight);
          times = parseInt(document.body.clientHeight / 1080);

          // 超出图片的限制高度, 生成PDF
          if (document.body.clientHeight > page_screentshot_height_limit) {
            height_limit = true;
          }
          // 超出网页的限制高度, 不再滚动
          if (document.body.clientHeight > max_height_px && scroll_times > 40) {
            result_map['resultCode'] = system_warn;
            result_map['warning'] = '网页加载高度过长, 易造成数据获取失败。';
            scrollEnable = false;
          }
        } else {
          scrollEnable = false;
        }

        times = times + 1;
        return {
          'scrollEnable': scrollEnable,
          'height_limit': height_limit,
          'times': times,
          'title': document.title
        };

      }, 60000, 60000, height_limit, result_map, system_warn, request_url, scroll_times);

      // 等待随机时间
      let randomMillSecond = randomNum(600, 1000);
      await sleep(randomMillSecond);
      scroll_times++;
      console.log(request_url + ' 需要滚动 : ' + mValues.times + '次 , 滚动第[' + scroll_times + ']次');
      if (scroll_times > mValues.times) {
        console.log(request_url + ' 结束');
        mValues.scrollEnable = false;
      }
    }

    console.log(mValues);
    await page.screenshot({
      path: localpath,
      fullPage: true
    });

  } catch (e) {
    console.log(e);
    console.log('执行异常');
  } finally {
    await browser.close();
  }

  res.header("Content-Type", "image/jpeg");
  res.sendFile(process.cwd() + '/' + localpath);
})

//延时函数
function sleep(delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(1)
      } catch (e) {
        reject(0)
      }
    }, delay)
  })
}


// 随机数
function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10);
    case 2:
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
    default:
      return 0;
  }
}

module.exports = router;