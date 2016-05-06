var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CusipIdDefinition =
{
	cusip: { type:String, index: 1}
};

var CusipValueDefinition =
{
		nameOfIssuer: String,
		nameOfIssuerLC: String,
		ticker: { type: String, index: 1}
};

var CusipSchema = new Schema(
{
	_id: CusipIdDefinition,
	value: CusipValueDefinition
},
{ collection: "cusips" }
);

mongoose.model('CusipId', CusipIdDefinition);
mongoose.model('CusipValue', CusipValueDefinition);
mongoose.model('Cusip', CusipSchema);