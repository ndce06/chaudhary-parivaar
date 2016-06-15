var port = process.env.PORT || 3000;
var hostname = process.env.HOST || process.env.HOSTNAME;
module.exports = {
    "connectionString": process.env.MONGOHQ_URL,
    "apiUrl": "http://"+hostname+":"+port+"/api",
    "secret": "chaudhary-parivaar"
};
