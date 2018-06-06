var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');

var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit: 100,
	host: 'localhost',
	user: 'root',
	database: 'shopping',
	password: 'password'
});

var smtpTransport = nodemailer.createTransport({
    service: 'naver',
    auth: {
        user: 'matthong35@naver.com',
        pass: ''
    },
    tls: {
        rejectUnauthorized: false
    }
});

router.get('/info', function(req, res, next) {
    if(req.cookies.id == undefined)
        res.send("<script>alert('잘못된 접근입니다. 메인 페이지로 이동합니다.'); location.replace('/'); </script>");
    else if(req.cookies.id == 'admin')
        res.send("<script>alert('관리자로 로그인하셨습니다. 관리자 페이지로 이동합니다.'); location.replace('/admin');</script>");
    else {
        pool.getConnection(function(err, connection) {
            var selectQuery = "select * from account where id = '" + req.cookies.id + "'";
            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                res.render('info', {title: "계정 정보", rows: rows});
                connection.release();
            });
        });
    }
});

/* 비밀번호 페이지를 불러오는 과정 */
router.get('/password', function(req, res, next) {
    if(req.cookies.id == undefined) {
        res.send("<script>alert('잘못된 접근입니다. 메인 페이지로 이동합니다.'); location.replace('/'); </script>");    }
    else {
        pool.getConnection(function(err, connection) {
            var selectQuery = "select * from account where id = '" + req.cookies.id + "'";
            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                res.render('password', {title: "비밀번호 변경", rows: rows});
                connection.release();
            });
        });
    }
});

router.post('/password', function(req, res, next) {
    var currentPassword = req.body.current;
    var newPassword = req.body.new1;
    var id = req.body.id;
    var datas = [newPassword, id, currentPassword];

    pool.getConnection(function(err, connection) {
        var updateQuery = 'update account set password = ? where id = ? and password = ?';
        connection.query(updateQuery, datas, function(err, rows) {
            if(err) console.error(err);

            if(rows.affectedRows == 0) {
                res.send("<script>alert('현재 비밀번호가 일치하지 않습니다. 다시 입력하여 주십시오.'); history.go(-1);</script>");
                connection.release();
            }
            else {
                res.send("<script>alert('비밀번호가 정상적으로 변경되었습니다.'); history.go(-1);</script>");
                connection.release();
            }
        });
    });
});

/* 로그인 검증하는 부분 */
router.post('/login', function(req, res, next) {
    var url = req.headers.referer;
    var id = req.body.loginID;
    var passwd = req.body.loginPW;
    var datas = [id, passwd];

    pool.getConnection(function(err, connection) {
        var selectQuery = 'select id, password from account where id = ? and password = ?';

        connection.query(selectQuery, datas, function(err, rows) {
            if(rows[0] == undefined) {
                res.send('<script>alert("아이디 또는 패스워드가 일치하지 않습니다."); history.back() ;</script>');
            }
            else {
                var queryText = '<script>alert("로그인에 성공하였습니다. 페이지를 새로고침 합니다.");';
                queryText += "var today = new Date();"
                    + "today.setDate(today.getDate() + 7);"
                    + "document.cookie = 'id' + '=' + escape('" + id + "') + \"; path=/;\";"
                    + "location.href='" + url + "'; </script>";

                res.send(queryText);
            }
        });
    });
});

router.post('/email', function(req, res, next) { // 이메일을 보냄
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        var mailOptions = {
            from: 'VEGEFRUIT <matthong35@naver.com>',
            to: collectedData.email,
            subject: collectedData.subject,
            html: collectedData.html
        };

        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) console.error(error);

            smtpTransport.close();
        });

        res.send(true);
    });
});

router.post('/valid', function(req, res, next) { // 판매자 인증 유효성 검사
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        pool.getConnection(function(err, connection) {
            var selectQuery = 'select * from validation where id = "' + collectedData.id + '"';
    
            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                if(rows[0] == undefined) {
                    var checkQuery = 'select count(*) as total from orders where id = "' + collectedData.id + '"';

                    connection.query(checkQuery, function(err, rows) {
                        if(err) console.error(err);

                        if(rows[0].total < 10) {
                            res.send("판매자 인증 조건을 충족하지 않습니다. (조건: 상품 10개 이상 주문)");
                            connection.release();
                        }
                        else {
                            var insertQuery = 'insert into validation(id) values("' + collectedData.id + '")';

                            connection.query(insertQuery, function(err, rows) {
                                if(err) console.error(err);
                                
                                res.send("관리자에게 판매자 인증 요청을 보냈습니다.");
                                connection.release();
                            });
                        }
                    });
                }
                else {
                    res.send("이미 판매자 인증 요청을 보낸 상태입니다");
                    connection.release();
                }
            });
        });
    });
});

router.post('/change', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);
    
        var datas = [collectedData.name, collectedData.phone, collectedData.email, collectedData.id];

        pool.getConnection(function(err, connection) {
            var updateQuery = 'update account set name = ?, phone = ?, email = ? where id = ?';

            connection.query(updateQuery, datas, function(err, rows) {
                if(err) console.error(err);

                res.send(true);
            });
        });
    });
});

router.get('/withdrawal', function(req, res, next) {
    if(req.cookies.id == undefined) {
        res.send("<script>alert('잘못된 접근입니다. 메인 페이지로 이동합니다.'); location.replace('/'); </script>");    }
    else {
        pool.getConnection(function(err, connection) {
            var selectQuery = "select * from account where id = '" + req.cookies.id + "'";
            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                res.render('withdrawal', {title: "회원 탈퇴", row: rows[0]});
                connection.release();
            });
        });
    }
});

router.post('/withdrawal', function(req, res, next) {
    var id = req.body.loginID;
    var passwd1 = req.body.pw1;
    var passwd2 = req.body.pw2;
    var datas = [id, passwd1, passwd2];

    pool.getConnection(function(err, connection) {
        var selectQuery = 'delete from account where id = ? and password = ? and password = ?';
        connection.query(selectQuery, datas, function(err, rows) {
            if(rows.affectedRows == 0) {
                res.send('<script>alert("패스워드가 일치하지 않습니다."); history.back() ;</script>');
            }
            else {
                res.send("<script>alert('회원 탈퇴가 완료되었습니다.'); document.cookie = 'id=; expires=Thu, 01 Jan 1970 00:00:01 GMT;' + '; path=/'; location.replace('/');</script>");
            }
            connection.release();
        });
    });
});

module.exports = router;