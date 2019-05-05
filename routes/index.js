var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var gm = require('gm');//.subClass({imageMagick: true});
// let imageMagick = gm.subClass({imageMagick: true});
var fs = require('fs');



/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('upload', {
    title: 'Express'
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

    gm(file.path).size(function(err,value){
      console.log(err||value)
    });

    gm(file.path)
      .resize(150, 150,'!') //加('!')强行把图片缩放成对应尺寸150*150！
      .write('public/images/' + file.originalFilename, function (err) {
        if (err) {
          console.log(err);
          res.send(JSON.stringify(err));
        }else{
          res.header("Content-Type", "image/jpeg");
          res.sendFile(process.cwd() + '/public/images/'+file.originalFilename)
        }
      });



  });

})

module.exports = router;