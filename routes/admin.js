var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var os = require('os-utils');
var diskspace = require('diskspace');

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
    if(req.cookies.id != 'admin')
        res.send("<script>alert('잘못된 접근입니다. 메인 페이지로 이동합니다.'); location.replace('/');</script>");
    
    pool.getConnection(function(err, connection) {
        var selectQuery = "select * from account";
        connection.query(selectQuery, function(err, rows) {
            if(err) console.error(err);

            res.render('admin', {title: '관리자 페이지', rows: rows});
            connection.release();
        });
    });
});

router.post('/get/statistic', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        pool.getConnection(function(err, connection) {
            var selectQuery = "";

            switch(collectedData.category) {
                case "CATEGORY": {
                    selectQuery += "select sum(soldAmount) as fruit from items where sort = 'fruit'; ";
                    selectQuery += "select sum(soldAmount) as vegetable from items where sort = 'vegetable'; ";
                    selectQuery += "select sum(soldAmount) as beverage from items where sort = 'beverage'; ";
                    break;
                }
                case "AMOUNT": {
                    selectQuery += "select num, soldAmount, rating from items where sort = 'fruit' order by soldAmount desc limit 1; ";
                    selectQuery += "select num, soldAmount, rating from items where sort = 'vegetable' order by soldAmount desc limit 1; ";
                    selectQuery += "select num, soldAmount, rating from items where sort = 'beverage' order by soldAmount desc limit 1; ";
                    break;
                }
                case "MEMBER": {
                    for(var i = 4; i >= 0; i--) {
                        var date = new Date();
                        date.setHours(0,0,0,0);

                        date.setDate(date.getDate() - i);

                        selectQuery += 'select count(*) as currentMember from account where date(stamp) <= "' + (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()) + '"; ';
                        selectQuery += 'select count(*) as newMember from account where date(stamp) = "' + (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()) + '"; ';
                    }
                    break;
                }
            };

            connection.query(selectQuery, function(err, rows){
                if(err) console.error(err);

                res.send({rows: rows});
                connection.release();
            });
        });
    });
});

router.post('/get/summary', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        os.cpuUsage(function(usage) {
            diskspace.check('C', function (err, result) {
                var cpuUsage = parseInt(usage * 100);
                var memUsage = 100 - parseInt(os.freememPercentage() * 100);
                var diskUsage = parseInt((result.free / result.total) * 100);

                pool.getConnection(function(err, connection) {
                    var selectQuery = 'select count(*) as account from account; '
                        + 'select count(*) as items from items; '
                        + 'select count(*) as orders from orders; ';
        
                    connection.query(selectQuery, function(err, rows){
                        if(err) console.error(err);
        
                        res.send({rows: rows, cpu: cpuUsage, mem: memUsage, disk: diskUsage});
                        connection.release();    
                    });
                });
            });
        });
    });
});

router.post('/get/database', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        pool.getConnection(function(err, connection) {
            var selectQuery = "";
            var arg = collectedData.arg;
            var countQuery = "";

            switch(collectedData.category) {
                case "ACCOUNTDB": {
                    selectQuery += "select * from account ";
                    countQuery = "select count(*) as allitems from account ";

                    if(collectedData.arg != "") {
                        selectQuery += 'where id like "%' + arg + '%" or name like "%' + arg + '%" or phone like "%' + arg + '%" or email like "%' + arg + '%" ';
                        countQuery += 'where id like "%' + arg + '%" or name like "%' + arg + '%" or phone like "%' + arg + '%" or email like "%' + arg + '%" ';
                    }
                    selectQuery += 'order by id limit ' + ((collectedData.page - 1) * 5) + ', 5';
                    break;
                }
                case "ITEMSDB": {
                    selectQuery += "select * from items ";
                    countQuery = "select count(*) as allitems from items ";

                    if(collectedData.arg != "") {
                        selectQuery += 'where num like "%' + arg + '%" or name like "%' + arg + '%" or sort like "%' + arg + '%" or seller like "%' + arg + '%" ';
                        countQuery += 'where num like "%' + arg + '%" or name like "%' + arg + '%" or sort like "%' + arg + '%" or seller like "%' + arg + '%" ';
                    }
                    selectQuery += 'order by name limit ' + ((collectedData.page - 1) * 5) + ', 5';
                    break;
                }
                case "ORDERSDB": {
                    selectQuery += "select * from orders ";
                    countQuery = "select count(*) as allitems from orders ";

                    if(collectedData.arg != "") {
                        selectQuery += 'where id like "%' + arg + '%" or recipient like "%' + arg + '%" or address like "%' + arg + '%" ';
                        countQuery += 'where id like "%' + arg + '%" or recipient like "%' + arg + '%" or address like "%' + arg + '%" ';
                    }
                    selectQuery += 'order by id limit ' + ((collectedData.page - 1) * 5) + ', 5';
                    break;
                }
                case "VALIDATIONDB": {
                    selectQuery += 'select * from account where id in (select id from validation) ';
                    countQuery = "select count(*) as allitems from validation ";

                    if(collectedData.arg != "") {
                        selectQuery += 'and id like "%' + arg + '%" ';
                        countQuery += 'where id like "%' + arg + '%" ';
                    }
                    selectQuery += 'order by id limit ' + ((collectedData.page - 1) * 5) + ', 5';
                    break;
                }
            };

            connection.query(selectQuery, function(err, rows){
                if(err) console.error(err);

                connection.query(countQuery, function(err, result) {
                    if(err) console.error(err);

                    res.send({rows: rows, result: result});
                    connection.release();    
                })
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

        pool.getConnection(function(err, connection) {
            var deleteQuery = "";
            var datas = "";
            var arg = collectedData.arg;

            switch(collectedData.database) {
                case "ACCOUNT": {
                    deleteQuery = 'delete from account where id = "' + collectedData.id + '"'; 
                    break;
                }
                case "ITEM": {
                    deleteQuery = 'delete from items where num = "' + collectedData.num + '"'; 
                    break;
                }
                case "ORDER": {
                    collectedData.stamp = new Date(collectedData.stamp);

                    datas = [collectedData.id, collectedData.recipient, collectedData.phone, collectedData.address, collectedData.num, collectedData.quantity, collectedData.stamp, collectedData.proc];

                    deleteQuery = 'delete from orders where id = ? and recipient = ? and phone = ? and address = ? and num = ? and quantity = ? and stamp = ? and proc = ? limit 1';                    
                    break;
                }
                case "VALIDATIONDB": {
                    deleteQuery = "delete from validation where id in('";

                    var splittedString = String(collectedData.sentence).split(',');
                    var mergedString = "";

                    for(var i = 0; i < splittedString.length; i++) {
                        mergedString += "', '" + splittedString[i];
        
                        if((splittedString.length - 1) == i)
                            mergedString = mergedString.replace("', '", "");
                    }
        
                    deleteQuery += mergedString + "')";
                    break;
                }
            };

            connection.query(deleteQuery, datas, function(err, rows){
                if(err) console.error(err);

                res.send(true);
                connection.release();    
            });
        });
    });
});

router.post('/update', function(req, res, next) {
    var collectedData = "";
    
    req.on('data', function(data) {
        collectedData += data;
    });

    req.on('end', function() {
        collectedData = JSON.parse(collectedData);

        pool.getConnection(function(err, connection) {
            var updateQuery = "update account set position = 1 where id in('";
            var deleteQuery = "delete from validation where id in('";

            var splittedString = String(collectedData.sentence).split(',');
            var mergedString = "";

            for(var i = 0; i < splittedString.length; i++) {
                mergedString += "', '" + splittedString[i];

                if((splittedString.length - 1) == i)
                    mergedString = mergedString.replace("', '", "");
            }

            updateQuery += mergedString + "'); " + deleteQuery + mergedString + "');";

            connection.query(updateQuery, function(err, rows){
                if(err) console.error(err);

                res.send(true);
                connection.release();    
            });
        });
    });
});

module.exports = router;