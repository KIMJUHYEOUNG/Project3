var express = require('express');
var router = express.Router();
var multer = require('multer');
var filePath = require('path');
var fs = require('fs');

var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit: 100,
	host: 'localhost',
	user: 'root',
	database: 'shopping',
	password: 'password'
});

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
	    cb(null, 'public/images/')
	},
	filename: function (req, file, cb) {
		cb(null, new Date().valueOf() + filePath.extname(file.originalname));
	}
});

var upload = multer({ storage: storage });

router.get('/', function(req, res, next) {
    if(req.cookies.id == undefined)
        res.send("<script>alert('잘못된 접근입니다. 메인 페이지로 이동합니다.'); location.replace('/'); </script>");
    else if(req.cookies.id == 'admin')
        res.send("<script>alert('관리자로 로그인하셨습니다. 관리자 페이지로 이동합니다.'); location.replace('/admin');</script>");
    else {
        pool.getConnection(function(err, connection) {
            var selectQuery = "select * from account where id = '" + req.cookies.id + "'";
            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                if(rows[0].position == 0) {
                    res.send("<script>alert('판매자만 접근 가능한 메뉴입니다.'); history.go(-1); </script>");
                    connection.release();
                }
                else {
                    selectQuery = "select * from items where seller = '" + req.cookies.id + "' order by soldAmount desc";

                    connection.query(selectQuery, function(err, rows) {
                        if(err) console.error(err);

                        res.render('seller', {title: "판매자 메뉴", rows: rows});
                        connection.release();
                    });
                }
            });
        });
    }
});

router.post('/', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        pool.getConnection(function(err, connection) {
            var deleteQuery = 'delete from items where seller = "' + collectedData.id + '" and num in (';

            var splittedString = collectedData.num.split(',');
            var mergedString = "";

            for(var i = 0; i < splittedString.length; i++) {
                mergedString += ", " + splittedString[i];

                if((splittedString.length - 1) == i)
                    mergedString = mergedString.replace(", ", "");
            }

            deleteQuery += mergedString + ")";

            connection.query(deleteQuery, function(err, rows) {
                if(err) console.error(err);

                res.send(true);
                connection.release();
            });
        });
    });
});

router.get('/register', function(req, res, next) {
    if(req.cookies.id == undefined)
        res.send("<script>alert('잘못된 접근입니다. 메인 페이지로 이동합니다.'); location.replace('/'); </script>");
    else {
        pool.getConnection(function(err, connection) {
            var selectQuery = "select * from account where id = '" + req.cookies.id + "'";
            connection.query(selectQuery, function(err, rows) {
                if(err) console.error(err);

                if(rows[0].position == 0) {
                    res.send("<script>alert('판매자만 접근 가능한 메뉴입니다.'); history.go(-1); </script>");
                    connection.release();
                }
                else {
                    res.render('register', {title: "물품 등록", rows: rows});
                    connection.release();
                }
            });
        });
    }
});

router.post('/register', upload.single('file'), function(req, res, next){
    var body = req.body;

    pool.getConnection(function(err, connection) {
        if(req.file == undefined)
            res.send("<script>alert('사진이 존재하지 않습니다. 사진을 올려주세요.'); history.go(-1);</script>");
        else {
            var image = "/images/" + req.file.filename;

            var datas = [body.name, body.description, body.price, body.amount, body.category, body.id, image, body.shipping ];

            var insertQuery = "insert into items(name, description, price, soldAmount, currentAmount, sort, seller, imageURL, rating, freeShipping)"
                + "values(?, ?, ?, 0, ?, ?, ?, ?, 100, ?)";
            connection.query(insertQuery, datas, function(err, rows) {
                if(err) console.error(err);

                res.send("<script>alert('정상적으로 등록되었습니다.'); location.replace('/seller'); </script>");
                connection.release();
            });
        }
    });
});

module.exports = router;