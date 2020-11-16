var express  = require('express');
var router = express.Router();
var Post = require('../models/Post');
var User = require('../models/User');
var util = require('../util');

router.get('/', async function(req, res){
    var searchQuery = await createSearchQuery(req.query);
    var posts = [];

    if(searchQuery) {
      posts = await Post.find(searchQuery)
        .populate('author')
        .sort('-createdAt')
        .exec();
    }

    res.render('search', {
        posts:posts,
        searchType:req.query.searchType, // 2
        searchText:req.query.searchText  // 2
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
      if(postQueries.length > 0) searchQuery = {$or:postQueries};
      else searchQuery = null; 
    }
    return searchQuery;
}

module.exports = router;