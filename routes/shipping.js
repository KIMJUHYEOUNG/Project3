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

router.get('/:page', function(req, res, next) {
    var page = req.params.page;

    if(req.cookies.id == undefined)
        res.send("<script>alert('잘못된 접근입니다. 메인 페이지로 이동합니다.'); location.replace('/'); </script>");
    else if(req.cookies.id == 'admin')
        res.send("<script>alert('관리자로 로그인하셨습니다. 관리자 페이지로 이동합니다.'); location.replace('/admin');</script>");
    else {
        pool.getConnection(function(err, connection) {
            var selectQuery = "select * from orders inner join items on items.num = orders.num where id = '" + req.cookies.id + "' order by orders.stamp desc, orders.proc asc "
                + "limit " + ((page - 1) * 10) + ", 10";

            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                selectQuery = "select count(*) as allitems from orders where id = '" + req.cookies.id + "'";
                connection.query(selectQuery, function(err, result) {
                    res.render('shipping', {title: "주문/배송 조회", rows: rows, pages: page, result: result});
                    connection.release();
                });
            });
        });
    }
});

router.post('/modify', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        var datas = [collectedData.recipient, collectedData.address, collectedData.phone, collectedData.quantity, collectedData.oldRecipient, collectedData.oldAddress, collectedData.oldPhone, collectedData.oldQuantity, collectedData.id];

        pool.getConnection(function(err, connection) {
            var updateQuery = 'update orders set recipient = ?, address = ?, phone = ?, quantity = ? where recipient = ? and address = ? and phone = ? and quantity = ? and id = ? and proc = 0 limit 1';

            connection.query(updateQuery, datas, function(err, rows) {
                if(err) console.error(err);

                res.send(true);
                connection.release();
            });
        });
    });
});

module.exports = router;