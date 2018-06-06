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

router.post('/add', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        var id = collectedData.id;
        var num = collectedData.num;
        var quantity = collectedData.quantity;

        pool.getConnection(function(err, connection) {
            var insertQuery = 'insert into basket(id, num, quantity) values("' + id + '", ' + num + ', ' + quantity + ')';

            connection.query(insertQuery, function(err, rows) {
                if(err) console.error(err);

                res.send(true);
                connection.release();
            });
        });
    });
});

router.get('/', function(req, res, next) {
    if(req.cookies.id == undefined)
        res.send("<script>alert('잘못된 접근입니다. 메인 페이지로 이동합니다.'); location.replace('/'); </script>");
    else if(req.cookies.id == 'admin')
        res.send("<script>alert('관리자로 로그인하셨습니다. 관리자 페이지로 이동합니다.'); location.replace('/admin');</script>");
    else {
        pool.getConnection(function(err, connection) {
            var selectQuery = "select * from items inner join basket on items.num = basket.num where id = '" + req.cookies.id + "'";
            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                res.render('basket', {title: "장바구니", rows: rows});
                connection.release();
            });
        });
    }
})

router.post('/change', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        var datas = [collectedData.quantity, collectedData.id, collectedData.num, collectedData.previousQuantity];

        pool.getConnection(function(err, connection) {
            var updateQuery = 'update basket set quantity = ? where id = ? and num = ? and quantity = ?';

            connection.query(updateQuery, datas, function(err, rows) {
                if(err) console.error(err);

                res.send(true);
                connection.release();
            });
        });
    });
});

router.post('/delete', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        var datas = [collectedData.quantity, collectedData.id, collectedData.num];

        pool.getConnection(function(err, connection) {
            var updateQuery = 'delete from basket where quantity = ? and id = ? and num = ? limit 1';
            
            if(collectedData.state == 1)
                updateQuery = 'delete from basket';
            
            connection.query(updateQuery, datas, function(err, rows) {
                if(err) console.error(err);

                res.send(true);
                connection.release();
            });
        });
    });
});

module.exports = router;