const username = "crazyzebra@gmail.com";

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

var params = {
    TableName: 'AnimalPointsTable',
    Key: {
        "Name": {S: username }
    } 
}

exports.GetScores = async (event, context, callback) => {

    
    //Get the total number of points for the user
    //This value will be used as the base value during point incrementation
    async function getObjectBackFromDD () {
        try {
            return await ddb.getItem(params).promise();
        } 
        catch (e) 
        {
            throw new Error(`Could not retrieve data from DynamoDB`)
        }
    };
    
    var responseFromDynamoDB = await getObjectBackFromDD();

    //If Lambda cannot locate user entry in database just do an insert
    var existingPoints = 0;
    if(!isEmpty(responseFromDynamoDB))
    {
       existingPoints = responseFromDynamoDB.Item.Points.N;
    }
    
    //Add a point
    var totalUserPoints = +existingPoints + +event.AddPoint;
    ddb.putItem(updateUserPoints(totalUserPoints), function(err,data)
    {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });
    
    
    callback(null, {
       "User": username,
       "TotalPoints": totalUserPoints
    });
};

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function updateUserPoints (totalPoints) {
    var insertedValues = {
        TableName: 'Scores',
        Item: {
            "Name": { S: username },
            "AnimalTeam": { S: 'Koala' },
            "Points": { N: totalPoints.toString() }
        }
    }
    return insertedValues;
}