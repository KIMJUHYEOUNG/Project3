var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit: 100,
	host: 'localhost',
	user: 'root',
	database: 'shopping',
	password: 'password'
});

/* 검색 창으로부터 검색 결과 얻어오는 부분 */
router.get('/', function(req, res, next) {
    if(req.cookies.id == 'admin')
        res.send("<script>alert('관리자로 로그인하셨습니다. 관리자 페이지로 이동합니다.'); location.replace('/admin');</script>");

    var query = req.query.query;
    var page = req.query.page;

    pool.getConnection(function(err, connection) {
        var selectQuery = 'select * from items where name like "%' + query + '%" or sort like "%' + query + '%" '
            + 'order by name limit ' + ((page - 1) * 10) + ', 10'
        connection.query(selectQuery, function(err, rows) {
            if(err) console.error(err);

            selectQuery = 'select count(*) as allitems from items where name like "%' + query + '%" or sort like "%' + query + '%"';
            connection.query(selectQuery, function(err, result) {
                if(err) console.error(err);
    
                res.render('result', { rows: rows, title: 'Search Result for ' + query, query: query, result: result, pages: page });
                connection.release();
            });
        });
    });
});
  
module.exports = router;