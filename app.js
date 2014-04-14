var http = require('http');
var fs = require('fs');
var date = '';
function fetchBefore(beforeDate) {
    http.get("http://news.at.zhihu.com/api/1.2/news/before/" + beforeDate, function (res) {
        if (res.statusCode != 200) return;
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var year = beforeDate.substr(0, 4);
            if (!fs.existsSync(year))    fs.mkdirSync(year);
            fs.writeFile(year + '/' + beforeDate + '.json', data);
            //if (beforeDate != '20130520') fetchBefore(JSON.parse(data).date);  //fetch all the history stories
        });
    });
}
(function fetchLatest() {
    http.get("http://news.at.zhihu.com/api/1.2/news/latest", function (res) {
        if (res.statusCode != 200) return;
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var json = JSON.parse(data);
            if (date != json.date) {
                date = json.date;
                fetchBefore(date);
            }
            fs.writeFile('latest.json', data);
        });
    });
    setTimeout(fetchLatest, 10 * 60 * 1000);
})();
http.createServer(function (request, response) {
    var url = request.url;
    if (url == '/favicon.ico')   return;
    var file = 'latest.json';
    if (url.length == 16) {
        var path = url.substr(8, 4) + '/' + url.substr(8, 8) + '.json';
        if (fs.existsSync(path))  file = path;
    }
    var data = fs.readFileSync(file);
    var json = JSON.parse(data);
    response.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    response.write('<!doctype html><html><head><title>知乎日报</title>');
    response.write('<meta name="viewport" content="width=device-width,user-scalable=no" />');
    response.write('<style>a{color:#333;text-decoration:none;}body{max-width:600px;margin:10px auto;padding:10px;}</style></head><body>');
    response.write('<h1><a href="/">知乎日报</a> - ' + json.display_date + '</h1>');
    for (var i = 0; i < json.news.length; i++) {
        response.write('<h3><a href="' + json.news[i].share_url + '" target="_blank">' + json.news[i].title + '</a></h3>');
    }
    response.write('<h3><a href="/before/' + json.date + '"><<< 前一天</a></h3>');
    response.write('</body></html>');
    response.end();
}).listen(process.env.PORT || 1337, null);