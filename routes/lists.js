var express = require('express');
var router = express.Router();
var List = require('../models/List');
//var fs = require('fs');

// list index
router.get('/', async function(req, res){
    await List.find({})
    .populate('_id')
    .sort('_id')
    .exec(function(err, lists){
      if(err) return res.json(err);
      res.render('lists/index', {lists:lists});
    });
  });


router.get('/:name', async function(req, res){
  await List.findOne({name:req.params.name})
    .exec(function(err, lists){
      if(err) return res.json(err);
      res.render('lists/test', {lists:lists});
    });




// update
router.put('/:name', function(req, res, next){
  List.findOne({name:req.params.name})
    .exec(function(err, list){
      if(err) return res.json(err);

      // update user object
      //user.originalPassword = user.password;
      //user.password = req.body.newPassword? req.body.newPassword : user.password;
      //for(var p in req.body){
      //  user[p] = req.body[p];
      //}
      list.result.push(req.body.userresults);

      // save updated user
      list.save(function(err, list){
        if(err){
          req.flash('errors', parseError(err));
        }
        res.redirect('/lists/'+list.name);
      });
  });

  
});
  //console.log(zzal);
 // res.render('lists/test', {zzal : zzal});
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

//ranking 
// router.get('/:name', async function(req, res){
//   await List.find({result})
//   .sort({'result':-1})
//   .exec(function(err, ranking){
//     console.log(ranking + "\n"); 
//     return; 
//   })
// }); 

module.exports = router;

