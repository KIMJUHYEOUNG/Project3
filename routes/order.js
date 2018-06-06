var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit: 100,
	host: 'localhost',
	user: 'root',
	database: 'shopping',
    password: 'password',
    multipleStatements: true
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

                res.render('order', {title: "주문하기", rows: rows});
                connection.release();
            });
        });
    }
})

router.post('/', function(req, res, next) {
    var id = req.body.id;
    var name = req.body.name;
    var phone = req.body.phone1 + "-" + req.body.phone2 + "-" + req.body.phone3;
    var address = req.body.address1 + " " + req.body.address2;
    var card = req.body.card1 + "-" + req.body.card2 + "-" + req.body.card3 + "-" + req.body.card4;
    var cvc = req.body.cvc;
    var expireMonth = req.body.expireMonth;
    var expireYear = req.body.expireYear;
    var datas = [name, phone, address, card, cvc, expireMonth, expireYear, id];

    pool.getConnection(function(err, connection) {
        var insertQuery = 'insert into orders(id, num, quantity) select id, num, quantity from basket where id = "' + id + '"';
        connection.query(insertQuery, function(err, rows){
            if(err) console.error(err);

            var updateQuery = 'update orders set recipient = ?, phone = ?, address = ?, card = ?, cvc = ?, expireMonth = ?, expireYear = ? '
                + 'where id = ? and recipient is null';
            connection.query(updateQuery, datas, function(err, rows) {
                if(err) console.error(err);

                var selectQuery = 'select num, quantity from basket where id = "' + id + '"';
                connection.query(selectQuery, function(err, rows) {
                    if(err) console.error(err);

                    var tempQueryFront = 'update items set soldAmount = soldAmount + ';
                    var tempQueryMiddle = ', currentAmount = currentAmount - ';
                    var tempQueryEnd = ' where num = ';

                    updateQuery = "";

                    for(var i = 0; i < rows.length; i++)
                        updateQuery += tempQueryFront + rows[i].quantity + tempQueryMiddle + rows[i].quantity + tempQueryEnd + rows[i].num + "; ";

                    connection.query(updateQuery, function(err, rows) {
                        if(err) console.error(err);

                        var deleteQuery = 'delete from basket where id = "' + id + '"';
                        connection.query(deleteQuery, function(err, rows){
                            if(err) console.error(err);

                            res.send('<script>alert("주문이 완료되었습니다. 주문 조회 페이지로 이동합니다."); location.replace("/shipping/1");</script>');
                            connection.release();
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;