var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.cookies.id == 'admin')
    res.send("<script>alert('관리자로 로그인하셨습니다. 관리자 페이지로 이동합니다.'); location.replace('/admin');</script>");

  res.render('index', { title: 'VEGEFRUIT' });
});

module.exports = router;
