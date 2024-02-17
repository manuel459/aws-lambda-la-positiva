const s3 = new AWS.S3();
const fs = require('fs');

async function extractionSSH(BucketName, KeyName){
    const response = { succest: 0 , message: "" ,body: {}}
    try {
        const params = {Bucket: BucketName , Key: KeyName }

        const result = await s3.getObject(params).promise() // Leer objeto
        const fileContent = result.Body.toString('utf-8');
        response.succest = 1
        response.message = "Clave ssh extraida con exito"
        response.body = fileContent
        console.log(response)

    } catch (error) {
        console.log(error);
        response.message =  `Error al extraer la clave ssh :${error}`
        return response
    }
    return response
}

async function downloadLocalFile(BucketGeneric, KeyOrigen){
    //----------------------------------------//
    //  Descarga el archivo de S3 localmente
    //---------------------------------------//
    const localFilePath = '/tmp/archivo_local.txt';
    const parametro = { Bucket: BucketGeneric, Key: KeyOrigen };
    const s3Object = await s3.getObject(parametro).promise();
    fs.writeFileSync(localFilePath, s3Object.Body);

    return localFilePath
}

async function connection(sftp, fileContent){
    const response = { succest: 0 , message: "" ,body: {}}
    try {
        await sftp.connect({
            host: "3.83.221.4",
            port: '22',
            username: 'ec2-user',
            privateKey: fileContent
        });
        response.succest = 1
        response.message = 'Successfully connected to sftp'
        response.body = sftp 
        console.log(response);

      } catch (error) {
        console.log(error);
        response.message = `Error en la conexión: ${error}`
        return response
    }

    return response;
}

module.exports = {
    extractionSSH,
    downloadLocalFile,
    connection
}