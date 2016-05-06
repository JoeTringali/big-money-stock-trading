var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var IdDefinition =
{
	cusip: { type:String, index: 1},
	cik: String
};

var ValueDefinition =
{
		nameOfIssuer: String,
		nameOfIssuerLC: String,
		titleOfClass: String,
		filingManagerName: String,
		filingManagerNameLC: String,
		currentPeriodOfReport: Date,
		currentValue: { type: Number, index: -1 },
		// @@@ currentSshPrnamt: Number,
		previousPeriodOfReport: Date,
		previousValue: Number,
		// @@@ previousSshPrnamt: Number,
		totalValueDifference: { type: Number, index: -1 },
		maxCurrentValue: Number
};

var CusipCikHoldingSchema = new Schema(
{
	_id: IdDefinition,
	value: ValueDefinition
},
{ collection: "cusipCikHoldings" }
);

mongoose.model('CusipCikHoldingId', IdDefinition);
mongoose.model('CusipCikHoldingValue', ValueDefinition);
mongoose.model('CusipCikHolding', CusipCikHoldingSchema);