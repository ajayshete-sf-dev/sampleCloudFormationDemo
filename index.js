var aws = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

let awsCOnfig= {
    "region":"ap-south-1",
    "endpoint":"http://dynamodb.ap-south-1.amazonaws.com"
};

aws.config.update(awsCOnfig);

let dc = new aws.DynamoDB.DocumentClient();

exports.handler = async function(event) {
    console.log('Request event: ', event);
    let response;
    switch(true) {
      case event.requestContext.http.method === 'GET' && event.requestContext.http.resourcePath === "/health":
        response = buildResponse(200 , event);
        break;
      case event.requestContext.http.method === 'POST' && event.requestContext.http.path==="/activityRights":
        response = await createActivityRight(JSON.parse(event.body));
        break;
      case event.requestContext.http.method === 'GET' && event.requestContext.http.path=== "/activityRight":
        response = await getActivityRight(event.queryStringParameters.email);
        break;
      case event.requestContext.http.method === 'DELETE' && event.requestContext.http.path==="/activityRight":
        response = await deleteActivityRight(JSON.parse(event.body).id);
        break;
      case event.requestContext.http.method === "PUT" && event.requestContext.http.path === "/activityRight":
        response = await updateActivityRight(event.queryStringParameters.email, JSON.parse(event.body));
        break;
      case event.requestContext.http.method === 'GET' && event.requestContext.http.path=== "/activityRights":
        response = await getAllActivityRight();
        break;

      // case event.requestContext.http.method === "DELETE" && event.requestContext.http.path === "/activityRights":
      //   response = await deleteAllActivityRights();
      //   break;

      default:
        response = buildResponse(404, 'Content not found');
    }
    return response;
  };

// Create Activity right
 async function createActivityRight(requestBody){
    let uid = uuidv4();
    console.log("uuid", uid)

    var data = {
        id : uid,
        activity_right_name : requestBody.name,
        activity_right_description : requestBody.description,
        activity_right_uri : requestBody.uri
    };

    var params ={
        TableName : "activity_rights",
        Item: data
    };

    return await dc.put(params).promise().then( () =>{
        const body = {
            statusCode: 201,
            Message: 'Succesfully saved the object in the database',
            data : [data]
          };
          return buildResponse(201, body);
    }, (error) =>{
        console.error("Error received.....", error);
    });

  }


// get activity rights 
 async function getActivityRight(uid){
    var params = {
        TableName : "activity_rights",
        Key: {
            id:uid
        }
    };
    return await dc.get(params).promise().then( (response )=> {
        console.log(response);
        if(Object.keys(response).length ===0) {
            return buildResponse(400, `Activity Id-${uid} doesn't exists`);
        }
        else{
            return buildResponse(200, response.Item);
        }

    }, (err) =>{
        console.error("Error received", err);
    });
  }

// list all activity rights
  async function getAllActivityRight(){
    var params = {
      TableName : "activity_rights",
     
  };
  return await dc.scan(params).promise().then( (response )=> {
      console.log(response);
      return buildResponse(200, response);

  }, (err) =>{
      console.error("Error received", err);
  });

  }

  // async function deleteAllActivityRights(){

  // }

// update activity right
  async function updateActivityRight(uid, requestBody){
    console.log("req_body",requestBody);
    const j = requestBody;
    console.log("body",j);
    var params = {
      TableName: "activity_rights",
      Key: { 
        id: uid
       },
      // UpdateExpression: "set updated_by = :byUser, is_deleted = :boolValue, seq = :updateSeq, fname = :updateFName, name =  :updateName",
      UpdateExpression: "set name=:name , description=:description , uri=:uri",
      ExpressionAttributeValues: requestBody,
      // ExpressionAttributeValues: {
      //     ":byUser": "updateUser2",
      //     ":boolValue": false, 
      //     ":updateSeq" :3,
      //     ":updateFName": "akhil",
      //     ":updateName" : "A"
          
      // },
    
      ReturnValues: "UPDATED_NEW"

  };

  return await dc.update( params).promise().then( (res)=>{
    const body ={
      statusCode:200,
      Message:"Updated succesfully",
      data: [res.Item]
    };
    return buildResponse(200, body);
  }, (err)=>{
    console.error("Error occurred", err);
  });
  }

// delete activity right
  async function deleteActivityRight(uid){
    var params ={
        TableName :"activity_rights",
        Key:{
           id : uid
        }
    };
    return await dc.delete(params).promise().then( (response) =>{
        const body ={
            statusCode: 200,
            Message: 'Succesfully deleted the object in the database',
            data : [response.Item]
        };

        return buildResponse(200, body);
    }, (error) =>{
        console.error("Error found",error);
    });
  }

 // response 
  function buildResponse(statusCode, event){
      return{
        statusCode:statusCode,
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify(event)
    };
  }
  
 
