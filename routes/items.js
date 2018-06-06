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

router.get('/:input', function(req, res, next) {
    if(req.cookies.id == 'admin')
        res.send("<script>alert('관리자로 로그인하셨습니다. 관리자 페이지로 이동합니다.'); location.replace('/admin');</script>");

    var data = req.params.input;

    if(isNaN(data))
        res.render('kind', { title: 'Express', kind: data });
    else {
        pool.getConnection(function(err, connection) {
            var selectQuery = 'select * from items where num = "' + data + '"';
            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                res.render('detail', {title: '상품 상세 정보', rows: rows});
                connection.release();
            });
        });
    }
});

/* 과일 부분 상품 목록 가져오는 부분 */
router.post('/fruit/list/:page', function(req, res, next) {
    var collectedData = "";

    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        var quantity = collectedData.page;

        pool.getConnection(function(err, connection) {
            var selectQuery = 'select * from items where sort = "fruit"' 
                + ' order by ' + collectedData.sort
                + ' limit ' + ((quantity - 1) * 10) + ', 10';

            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);
    
                selectQuery = 'select count(*) as allitems from items where sort = "fruit"';

                connection.query(selectQuery, function(err, result) {
                    if(err) console.error(err);

                    res.send({rows: rows, result: result});
                    connection.release();
                });
            });
        });
    })
});

/* 채소 부분 상품 목록 가져오는 부분 */
router.post('/vegetable/list/:page', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        var quantity = collectedData.page;

        pool.getConnection(function(err, connection) {
            var selectQuery = 'select * from items where sort = "vegetable"' 
                + ' order by ' + collectedData.sort
                + ' limit ' + ((quantity - 1) * 10) + ', 10';

            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);
    
                selectQuery = 'select count(*) as allitems from items where sort = "vegetable"';

                connection.query(selectQuery, function(err, result) {
                    if(err) console.error(err);

                    res.send({rows: rows, result: result});
                    connection.release();
                });
            });
        });
    })
});

/* 음료 부분 상품 목록 가져오는 부분 */
router.post('/beverage/list/:page', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        var quantity = collectedData.page;

        pool.getConnection(function(err, connection) {
            var selectQuery = 'select * from items where sort = "beverage"' 
                + ' order by ' + collectedData.sort
                + ' limit ' + ((quantity - 1) * 10) + ', 10';

            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);
    
                selectQuery = 'select count(*) as allitems from items where sort = "beverage"';

                connection.query(selectQuery, function(err, result) {
                    if(err) console.error(err);
                   
                    res.send({rows: rows, result: result});
                    connection.release();
                });
            });
        });
    })
});

router.post('/review/register', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        var id = collectedData.id;
        var item = collectedData.num;
        var content = collectedData.content;
        var satisfaction = collectedData.satisfaction;

        pool.getConnection(function(err, connection) {
            var insertQuery = 'insert into review(content, id, item, satisfaction) values("' + content + '", "' + id + '", ' + item + ', ' + satisfaction + ')';

            connection.query(insertQuery, function(err, rows) {
                if(err) console.error(err);

                res.send(true);
                connection.release();
            });
        });
    }); 
});

router.post('/review/delete', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        var id = collectedData.id;
        var item = collectedData.item;
        var content = collectedData.content;
        var satisfaction = collectedData.satisfaction;
        var datas = [content, satisfaction, id, item];

        pool.getConnection(function(err, connection) {
            var insertQuery = 'delete from review where content=? and satisfaction=? and id=? and item=? limit 1';

            connection.query(insertQuery, datas, function(err, rows) {
                if(err) console.error(err);

                res.send(true);
                connection.release();
            });
        });
    }); 
});

router.post('/review/get', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        pool.getConnection(function(err, connection) {
            var selectQuery = 'select * from review where item = ' + collectedData.num + ' order by stamp desc '
                + 'limit ' + ((collectedData.page - 1) * 5) + ', 5';

            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                selectQuery = 'select count(*) as allitems from review where item = ' + collectedData.num;
                connection.query(selectQuery, function(err, result) {
                    if(err) console.error(err);
                    
                    res.send({rows: rows, result: result});
                    connection.release();
                });
            });
        });
    });
});

module.exports = router;