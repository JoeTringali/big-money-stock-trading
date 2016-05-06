
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Big Money $tock Trading' },
    function(err, rendered)
    {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(rendered);
	});
};
