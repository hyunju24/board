var express = require('express');
var router = express.Router();
var List = require('../models/List');
//var fs = require('fs');

// list index
router.get('/', async function(req, res){
    await List.find({})
    .populate('_id')
    .exec(function(err, lists){
      if(err) return res.json(err);
      res.render('lists/index', {lists:lists});
    });
  });


router.get('/image1', function(req, res){
  var zzal = List.find({name:'image1'},{_id:false})
  res.render('lists/test', {zzal : zzal});
  /* fs.readFile('views/lists/test.html', function(error, data){
    if(error){
      console.log(error);
    }else {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    }
  });
  */
});

module.exports = router;

