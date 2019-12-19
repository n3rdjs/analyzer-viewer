const express = require('express');
const mysql = require('mysql');
const app = express();
const { report_cred } = require('./config');

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', (req, res) => {

    var page = parseInt(req.query.page);
    var sig = !!req.query.sig;
    var search_str = req.query.search_str;
    var search_type = req.query.search_type;

    var name_q = '%';
    var result_q = '%';

    if (search_type == 'module_name') {
        name_q = '%' + search_str + '%'
    } else if (search_type == 'result') {
        result_q = '%' + search_str + '%'
    }

    if (!page || page < 1) {
        var conn = mysql.createConnection(report_cred);
        conn.connect();
        conn.query(`select id from proto_path2_v1 where status = 0 limit 1`, (err, result, fields) => {
            if (err) throw err;
            conn.end();
            let page = parseInt((result[0].id - 1) / 50) + 1;
            res.redirect('/?page=' + page);
        });
    } else {
        var conn = mysql.createConnection(report_cred);
        conn.connect();
        conn.query(`select * from proto_path2_v1 where ${sig ? "result like '%found!%'" : '1'} and name like ? and result like ? order by id asc limit ?,?`, [ name_q, result_q, (page - 1) * 50, 50 ], (err, result, fields) => {
            if (err) throw err;
            conn.end();
            res.render('index', { result : result, current_page : page, sig : sig, search_str : search_str, search_type : search_type });
        });
    }
});

app.get('/stats', (req, res) => {
    var conn = mysql.createConnection(report_cred);
    conn.connect();
    conn.query(`select scantime from proto_path2_v1 where status != 0 and id % 1000 = 0`, (err, result, fields) => {
        if (err) throw err;
        conn.end();
        console.log(result.map(data => data.scantime))
        res.render('stats', {data : JSON.stringify(result)});
    });
});

app.listen(process.env.PORT || 8080);