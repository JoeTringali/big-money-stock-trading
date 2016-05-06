var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var IdDefinition =
{
	cusip: { type:String, index: 1}
};

var ValueDefinition =
{
		nameOfIssuer: String,
		nameOfIssuerLC: { type: String, index: 1 },
		titleOfClass: String,
		totalCurrentValue: Number,
		// @@@ totalCurrentSshPrnamt: Number,
		totalPreviousValue: Number,
		// @@@ totalPreviousSshPrnamt: Number,
		totalValueDifference: { type: Number, index: -1 },
		// @@@ totalSshPrnamtDifference: { type: Number, index: -1 },
		totalCurrentFilings: Number,
		totalPreviousFilings: Number,
		totalFilingsDifference: { type: Number, index: -1 }
};

var HoldingSchema = new Schema(
{
	_id: IdDefinition,
	value: ValueDefinition
},
{ collection: "holdings" });

mongoose.model('HoldingId', IdDefinition);
mongoose.model('HoldingValue', ValueDefinition);
mongoose.model('Holding', HoldingSchema);
