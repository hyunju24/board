const { json } = require('body-parser');
var mongoose = require('mongoose');

// schema
var listSchema = mongoose.Schema({
  name: {type:String, required:[true]},
  img: {type:String, required:[true]},
  face_rate:{type:Number, required:[true]},
  pose_rate:{type:Number, required:[true]},
  fc_angry:{type:Number, required:[true]},
  fc_disgust:{type:Number, required:[true]},
  fc_fear:{type:Number, required:[true]},
  fc_laugh:{type:Number, required:[true]},
  fc_neutral:{type:Number, required:[true]},
  fc_sad:{type:Number, required:[true]},
  fc_smile:{type:Number, required:[true]},
  fc_surprise:{type:Number, required:[true]},
  result:[{type:Number}],
  //category: {type:String, required:[true]},
  //참조 구현 
  //author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
});

// model & export
var List = mongoose.model('list', listSchema);
module.exports = List;