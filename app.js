var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var urlencoded_body_parser = bodyParser.urlencoded({
    extended: true
});
app.use(bodyParser.json());
app.use(urlencoded_body_parser);
var http = require('http');
var path = require('path');
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
app.use('/', router);

// Then we'll pull in the database client library
var MongoClient = require("mongodb").MongoClient;

//------------------database connection start------
//mongoose.connect('mongodb://localhost:27017/login', { useMongoClient: true });

// Util is handy to have around, so thats why that's here.
const util = require('util');
// and so is assert
const assert = require('assert');

//mongoose = require('mongoose');// MongoDB connection library
//MongoStore = require('connect-mongo/es5')(session); // store sessions in MongoDB for persistence

//const ObjectID = require('mongodb').ObjectID;
//var sessionDB;

var url;
var f = require('util').format;
var fs = require('fs');
//var ca = [fs.readFileSync(__dirname + "/ca.pem")];
//var ca = [new Buffer(ca, 'base64')];

// Now lets get cfenv and ask it to parse the environment variable
var cfenv = require('cfenv'); //Cloud Foundry Environment Variables
var appEnv = cfenv.getAppEnv(); // Grab environment variables

if (appEnv.isLocal) {
    require('dotenv').load();
    var sessionDB = process.env.LOCAL_MONGODB_URL;
}
try {
	//cloudantService = appEnv.services.cloudantNoSQLDB[0];
  catalog_url = process.env.CATALOG_URL;
}
catch (e) {
	console.error("Error looking up service: ", e);
}

//console.log("Catalog URL is", catalog_url);
//process.env.LOCAL_MONGODB_URL



//console.log(appEnv.LOCAL_MONGODB_URL);
if(!appEnv.isLocal) {
    // Within the application environment (appenv) there's a services object
    var services = appEnv.services;
    var mongodb_services = services["compose-for-mongodb"];
    // This check ensures there is a services for MongoDB databases
    assert(!util.isUndefined(mongodb_services), "Must be bound to compose-for-mongodb services");
   // We now take the first bound MongoDB service and extract it's credentials object
    var credentials = mongodb_services[0].credentials;   
    // Within the credentials, an entry ca_certificate_base64 contains the SSL pinning key
    // We convert that from a string into a Buffer entry in an array which we use when
    // connecting.
    var ca = [new Buffer(credentials.ca_certificate_base64, 'base64')];
    // This is a global variable we'll use for handing the MongoDB client around
    var mongodb;
    // This is the MongoDB connection. From the application environment, we got the
    // credentials and the credentials contain a URI for the database. Here, we
    // connect to that URI, and also pass a number of SSL settings to the
    // call. Among those SSL settings is the SSL CA, into which we pass the array
    // wrapped and now decoded ca_certificate_base64,
    MongoClient.connect(credentials.uri, {
        mongos: {
            ssl: true,
            sslValidate: true,
            sslCA: ca,
            poolSize: 1,
            reconnectTries: 1
        }
    },
    function(err, db) {
        // Here we handle the async response. This is a simple example and
        // we're not going to inject the database connection into the
        // middleware, just save it in a global variable, as long as there
        // isn't an error.
        if (err) {
            console.log(err);
        } else {
            // Although we have a connection, it's to the "admin" database
            // of MongoDB deployment. In this example, we want the
            // "examples" database so what we do here is create that
            // connection using the current connection.
            mongodb = db.db("login");
    
      // Response handling
    let response = {
        status: 200,
        data: [],
        message: null
    };
    
       
    router.route('/api/logins/authenticate')
    // accessed at POST http://localhost:8080/api/authenticate)
    .post(function(req, res) {	   
      
       
        mongodb.collection('logins').find({email:req.body.email}).toArray(function(err, xuser) {
            
                   //console.log(xuser);
                    if (JSON.stringify(xuser) === '[]') {  
                       //console.log('Authentication failed. User not found'); 
                        res.json({ success: false, message: 'Authentication failed. User not found.' });
                    } else if (xuser[0].password == req.body.password){
                      //console.log('User matched...'); 
                      res.json('{message:Jason Matched}');
                       //res.json({token: jwt.sign({ "username" : xuser[0].username, "firstName" : xuser[0].firstName, _id: xuser[0]._id}, 'SECRETCODE'), "username" : xuser[0].username, "firstName" : xuser[0].firstName, "id":xuser[0]._id,"miles":xuser[0].miles});
                    } else {	
                      // console.log(xuser[0].password+req.body.password);
                      //console.log('Authentication failed. Wrong Password'); 		
                        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
                    }			
                    //res.json({message: 'OK'});  
                    });
    
    });
    

    // register user
    router.route('/api/logins/add')
    // accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {	   
     //  console.log(req.body);      
      
     mongodb.collection('logins').insert(req.body , function(err, result) {
            //if (err) throw err;
            //if (result) console.log('Added!');
            if (err) {
                res.json('Failed to Add Userr !'); 
                throw err;
            }
            if (result){
             //   console.log('Added!');
                res.json('User Added'); 
            } 
       });
       //res.json({message: 'OK'});
       //res.json('Order ID   '+ orderid.generate()+ '\r\nOrder Date  ' + new Date());    
       
    });
 
    
    
    } // else ends
    } // function db call ends
    ); // mongo client connection ends
    } // Cloud env loop ends


// Local Env DB connection

if(appEnv.isLocal){
    
    //mongoose.connect('mongodb://localhost:27017/login', { useMongoClient: true });
    
   // console.log(sessionDB);
    url = sessionDB + '/login';
    //console.log(url);
    const connection = (closure) => {
        return MongoClient.connect(url, (err, db) => {
          //  console.log('Local');    
        if (err) return console.log(err);
           
            closure(db);
        });
    };

    // Error handling
const sendError = (err, res) => {
    response.status = 501;
    response.message = typeof err == 'object' ? err.message : err;
    res.status(501).json(response);
};


//------------------------Database connection end-------------------

// function to fetch users. This is used for initial test. Not in use
/* router.get("/api/logins", function(req, res) {
    // and we call on the connection to return us all the documents in the
    // words collection.
    connection((db) => {
    db.collection('logins')
            .find()
            .toArray()
            .then((data)=> {
                //response.data = data;
                res.json(data);
                console.log(data);
                
    })
    .catch((err) => {
        response.status(500).send(err);
    });
   // response.send(users);
    });
}); */

router.route('/api/logins/authenticate')
// accessed at POST http://localhost:8080/api/authenticate)
.post(function(req, res) {	   
  
    connection((db) => {
    db.collection('logins').find({email:req.body.email}).toArray(function(err, xuser) {

      // console.log(xuser);
        if (JSON.stringify(xuser) === '[]') {  
          // console.log('Authentication failed. User not found'); 
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (xuser[0].password == req.body.password){
         // console.log('User matched...'); 
          res.json('{message:Jason Matched}');
           //res.json({token: jwt.sign({ "username" : xuser[0].username, "firstName" : xuser[0].firstName, _id: xuser[0]._id}, 'SECRETCODE'), "username" : xuser[0].username, "firstName" : xuser[0].firstName, "id":xuser[0]._id,"miles":xuser[0].miles});
        } else {	
         //  console.log(xuser[0].password+req.body.password);
        //  console.log('Authentication failed. Wrong Password'); 		
            res.json({ success: false, message: 'Authentication failed. Wrong password.' });
        }			
        //res.json({message: 'OK'});  
        });
    });
});


// register user
router.route('/api/logins/add')
// accessed at POST http://localhost:8080/api/logins/add
.post(function(req, res) {	   
  //console.log(req.body);      
  connection((db) => {
 db.collection('logins').insert(req.body , function(err, result) {
        //if (err) throw err;
        if (result) console.log('Added!');
        if (err) {
            res.json('Failed to Add Userr !'); 
            throw err;
        }
        if (result){
         // console.log('Added!');
            res.json('User Added'); 
        } 
    });    
   });
   //res.json({message: 'OK'});
  
   
});
  
}

//--------------Payment end-------------

// We want to extract the port to publish our app on
var port = process.env.PORT || 4000;
//console.log(port);


  app.listen(port, "0.0.0.0", function () {
    // print a message when the server starts listening
    console.log("Login server starting on Port " + port);
  });
 