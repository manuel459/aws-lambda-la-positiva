// Importa el módulo AWS SDK
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sftpClient = require('ssh2-sftp-client')
const flag = 1 //ACTIVAR O DESACTIVAR EL ENVIO AL SERVIDOR SFTP
const { extractionSSH, downloadLocalFile, connection } = require("./functions.js")

// Función principal de Lambda
exports.handler = async (event, context) => {
    console.log(event)

    //OBJECT RESPONSE RETURN
    const Response = { succest : 0 , message: "", body: {} } 

    try {
      //-----------------------------//
      //  CONVERTIR EL OBJETO A JSON  
      //-----------------------------//
      const sqsMessage = JSON.parse(event.Records[0].body)

      //--------------------------------------------//
      //  Almacenar los objetos existes en variables
      //--------------------------------------------//
      const BucketGeneric = sqsMessage.Records[0].s3.bucket.name
      const KeyOrigen = sqsMessage.Records[0].s3.object.key
      const Dominio = (KeyOrigen.split("/"))[1]
      const fileName = (KeyOrigen.split("/"))[2]

      console.log(BucketGeneric)
      console.log(KeyOrigen)
      console.log(fileName)

      if(flag == 0){
        //---------------------------//
        //  INICIALIZAR CLIENTE SFTP
        //---------------------------//
        let sftp = new sftpClient();

        //-------------------------------//
        //  EXTRAER ARCHIVO DE CLAVE SSH
        //-------------------------------// 
        let fileContent = await extractionSSH('claves-ssh-lambda-layer', 'Prueba_Manuel.pem')
        if(fileContent.succest == 0){
            Response.message = fileContent.message
            return Response
        }

        //--------------------------//
        //  CREAR CONEXION CON SFTP
        //--------------------------//

        let result = await connection(sftp, fileContent.body)

        if(result.succest == 0){
            Response.message = result.message
            return Response
        }
        sftp = result.body

        //-------------------------------------------------------------------//
        // Ruta remota donde deseas guardar el archivo en el servidor SFTP
        //-------------------------------------------------------------------//
        const remoteFilePath = `/home/ec2-user/${Dominio}/${fileName}`;

        //----------------------------------------//
        //  Descarga el archivo de S3 localmente
        //---------------------------------------//
        let localFilePath = await downloadLocalFile(BucketGeneric, KeyOrigen);

        //-----------------------------------------//
        // Enviar el archivo local al servidor SFTP
        //-----------------------------------------//
        await sftp.put(localFilePath, remoteFilePath);
      }

      //-----------------------------------------------------------------------------//
      //  Crear objeto para realizar la copia del archivo a la carpeta de procesados  
      //-----------------------------------------------------------------------------//
      const params = {
        Bucket: BucketGeneric,
        Key: `Procesados/${Dominio}/${fileName}`,
        CopySource: BucketGeneric + '/' + KeyOrigen
      }
      //-------------------//
      //  Validar los path
      //-------------------//
      if(!params.Bucket || !params.Key || !params.CopySource){
        Response.message = "Ocurrio un Error al recepcionar la cola sqs"
        console.log(Response)
        return Response
      }

      //-------------------------------//
      // Copiar los archivos procesados
      //------------------------------//
      const copyResult = await s3.copyObject(params).promise();

      //-------------------------------//
      // Validar la copia del archivo
      //------------------------------//
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
      
    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
        Response.message = `Error al procesar el mensaje:${error}`;
        return Response
    }
    return Response
}