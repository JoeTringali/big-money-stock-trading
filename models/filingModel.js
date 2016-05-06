var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/* @@@
var ShrsOrPrnAmtDefinition =
{
	sshPrnamt: Number,
	sshPrnamtType: String
};

var VotingAuthorityDefinition =
{
	Sole: Number,
	Shared: Number,
	None: Number
};
*/

var InfoTableDefinition =
{
	nameOfIssuer: String,
	nameOfIssuerLC: { type: String, index: 1 },
	titleOfClass: String,
	cusip: { type:String, index: 1},
	value: Number
	/* @@@ ,
	shrsOrPrnAmt: ShrsOrPrnAmtDefinition, 
	investmentDiscretion: String,
	votingAuthority: VotingAuthorityDefinition 
	*/
};

var InformationTableDefinition =
{
	infoTable: [InfoTableDefinition]
};

var AddressDefinition =
{
	street1: String,
	street2: String,
	city: String,
	stateOrCountry: String,
	zipCode: String
};

var FilingManagerDefinition =
{
	name: String,
	nameLC: { type: String, index: 1 },
	address: AddressDefinition
};

var FilingSchema = new Schema(
{
	url: { type: String, index: { unique: true } },
	submissionType: { type: String, index: 1},
	cik: { type: String, index: 1},
	periodOfReport: { type: Date, index: 1 },
	reportCalendarOrQuarter: { type: Date, index: 1 },
	filingManager: FilingManagerDefinition,
	form13FFileNumber: String,
	tableValueTotal: Number,
	informationTable: InformationTableDefinition
});

mongoose.model('InfoTable', InfoTableDefinition);
mongoose.model('Filing', FilingSchema);