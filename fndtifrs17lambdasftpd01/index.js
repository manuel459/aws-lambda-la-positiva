// Importa el módulo AWS SDK
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const s3 = new AWS.S3();

// Función principal de Lambda
exports.handler = async (event, context) => {

    //OBJECT RESPONSE RETURN
    const Response = { succest : 0 , message: "", body: {} } 

    try {
        
      const sqsMessage = JSON.parse(event.Records[0].body)

      const BucketGeneric = sqsMessage.Records[0].s3.bucket.name
      const KeyOrigen = sqsMessage.Records[0].s3.object.key
      const Dominio = (KeyOrigen.split("/"))[1]
      const fileName = (KeyOrigen.split("/"))[2]

      console.log(BucketGeneric)
      console.log(KeyOrigen)
      console.log(fileName)

      const params = {
        Bucket: BucketGeneric,
        Key: `Procesados/${Dominio}/${fileName}`,
        CopySource: BucketGeneric + '/' + KeyOrigen
      }

      if(!params.Bucket || !params.Key){
        Response.message = "Ocurrio un Error al recepcionar la cola sqs"
        console.log(Response)
        return Response
      }

      const copyResult = await s3.copyObject(params).promise();

      if(!copyResult)
      {
        Response.message = "Ocurrio un Error al copiar el archivo"
        Response.body = copyResult
        console.log(Response)
        return Response
      }

      Response.succest = 1;
      Response.message = "Mensaje Enviado con Exito"
      Response.body = copyResult
      console.log(Response)
      return Response

    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
        Response.message = `Error al procesar el mensaje:${error}`;
        return Response
    }
};