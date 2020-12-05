var express  = require('express');
var router = express.Router();
var multer = require('multer'); // 1
var upload = multer({ dest: 'public/uploadedFiles/' });
var User = require('../models/User');
var Post = require('../models/Post');
var Comment = require('../models/Comment');
var File = require('../models/File'); // 3
var util = require('../util');

router.get('/', async function(req, res){
    var searchQuery = await createSearchQuery(req.query);
    var posts = [];

    if(searchQuery) {
      posts = await Post.aggregate([
        { $match: searchQuery },
        { $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author'
        } },
        { $unwind: '$author' },
        { $sort : { createdAt: -1 } },
        { $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'post',
            as: 'comments'
        } },
        { $project: {
            title: 1,
            author: {
              username: 1,
            },
            views: 1,
            createdAt: 1
        } },
      ]).exec();
    }
    res.render('search/bar', {
        posts:posts,
        searchType:req.query.searchType, // 2
        searchText:req.query.searchText  // 2
        });
});

//show
router.get('/:id', function(req, res){
  var commentForm = req.flash('commentForm')[0] || {_id: null, form: {}};
  var commentError = req.flash('commentError')[0] || { _id:null, parentComment: null, errors:{}};

  Promise.all([
    Post.findOne({_id:req.params.id}).populate({ path: 'author', select: 'username' }).populate({path:'attachment',match:{isDeleted:false}}), 
    Comment.find({post:req.params.id}).sort('createdAt').populate({ path: 'author', select: 'username' })
    ])
    .then(([post, comments]) => {
      post.views++; // 2
      post.save();  // 2
      res.render('search/show', { post:post, comments:comments, commentForm:commentForm, commentError:commentError});
    })
    .catch((err) => {
      console.log('err: ', err);
      return res.json(err);
    });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  var post = req.flash('post')[0];
  var errors = req.flash('errors')[0] || {};
  if(!post){
    Post.findOne({_id:req.params.id})                           // 1
      .populate({path:'attachment',match:{isDeleted:false}})    // 1
      .exec(function(err, post){                                // 1
        if(err) return res.json(err);
        res.render('search/edit', { post:post, errors:errors });
      });
  }
  else {
    post._id = req.params.id;
    res.render('search/edit', { post:post, errors:errors });
  }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, upload.single('newAttachment'), async function(req, res){
  var post = await Post.findOne({_id:req.params.id}).populate({path:'attachment',match:{isDeleted:false}});
  if(post.attachment && (req.file || !req.body.attachment)){
    post.attachment.processDelete();
  }
  req.body.attachment = req.file?await File.createNewInstance(req.file, req.user._id, req.params.id):post.attachment;
  req.body.updatedAt = Date.now();
  Post.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err){
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/search/'+req.params.id+'/edit'+res.locals.getPostQueryString());
    }
    res.redirect('/search/'+req.params.id+res.locals.getPostQueryString());
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  Post.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/search'+res.locals.getPostQueryString());
  });
});

async function createSearchQuery(queries){ // 4
    var searchQuery = {};
    if(queries.searchType && queries.searchText && queries.searchText.length >= 3){
      var searchTypes = queries.searchType.toLowerCase().split(',');
      var postQueries = [];
      if(searchTypes.indexOf('title')>=0){
        postQueries.push({ title: { $regex: new RegExp(queries.searchText, 'i') } });
      }
      if(searchTypes.indexOf('body')>=0){
        postQueries.push({ body: { $regex: new RegExp(queries.searchText, 'i') } });
      }
      if(searchTypes.indexOf('author!')>=0){ // 2-1
        var user = await User.findOne({ username: queries.searchText }).exec();
        if(user) postQueries.push({author:user._id});
      }
      else if(searchTypes.indexOf('author')>=0){ // 2-2
        var users = await User.find({ username: { $regex: new RegExp(queries.searchText, 'i') } }).exec();
        var userIds = [];
        for(var user of users){
          userIds.push(user._id);
        }
        if(userIds.length>0) postQueries.push({author:{$in:userIds}});
      }
      if(postQueries.length>0) searchQuery = {$or:postQueries}; // 2-3
      else searchQuery = null;                                  // 2-3
    }
    return searchQuery;
}

module.exports = router;

// private functions
function checkPermission(req, res, next){
  Post.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}