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

router.get('/', function(req, res, next) {
    if(req.cookies.id == 'admin')
        res.send("<script>alert('관리자로 로그인하셨습니다. 관리자 페이지로 이동합니다.'); location.replace('/admin');</script>");
    else if(req.cookies.id != undefined)
        res.send("<script>alert('이미 로그인이 되어있습니다. 메인 페이지로 이동합니다.'); location.replace('/');</script>");
    
    res.render('signup', { title: '회원가입' });
});

router.post('/check', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        pool.getConnection(function(err, connection) {
            var selectQuery = 'select id from account where id = "' + collectedData.id + '"';
            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                var jsonPacket = {
                    message: ""
                }

                if(rows[0] == undefined) {
                    jsonPacket.message = "SUCCESSFUL";
                    res.send(jsonPacket);
                }
                else { 
                    jsonPacket.message = "NOT_SUCCESSFUL";
                    res.send(jsonPacket);
                }
                connection.release();
            });
        });
    });
});

router.post('/', function(req, res, next) {
    var id = req.body.id;
    var password = req.body.password;
    var name = req.body.name;
    var phone = req.body.phone;
    var email = req.body.email;
    var datas = [id, name, password, phone, email];

    pool.getConnection(function(err, connection) {
        var insertQuery = 'insert into account(id, name, password, phone, email) value(?, ?, ?, ?, ?);';
        connection.query(insertQuery, datas, function(err, rows) {
            if(err) console.error(err);

            res.send("<script>alert('회원가입이 정상적으로 완료되었습니다. 다시 로그인을 진행해 주십시오.'); location.replace('/');</script>");
            connection.release();
        });
    });
})

module.exports = router;
