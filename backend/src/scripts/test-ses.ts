import dotenv from 'dotenv';
dotenv.config();

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

async function testSES() {
  console.log('--- 🧪 DIAGNÓSTICO DE CONFIGURACIÓN AWS SES ---');

  const region = process.env.AWS_REGION?.trim();
  const fromEmail = process.env.SES_FROM_EMAIL?.trim();
  const fromName = (process.env.SES_FROM_NAME?.trim() || 'Arcoins Wallet').replace(/["\r\n]/g, '');
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const toEmail = process.argv[2]?.trim() || fromEmail;

  console.log(`1. Variables de entorno detectadas:`);
  console.log(`   - AWS_REGION: ${region || '❌ NO DEFINIDA'}`);
  console.log(`   - SES_FROM_EMAIL: ${fromEmail || '❌ NO DEFINIDA'}`);
  console.log(`   - SES_FROM_NAME: ${fromName}`);
  console.log(`   - AWS_ACCESS_KEY_ID: ${accessKeyId ? `✅ Presente (${accessKeyId.slice(0, 4)}...${accessKeyId.slice(-4)})` : '❌ NO DEFINIDA'}`);
  console.log(`   - AWS_SECRET_ACCESS_KEY: ${secretAccessKey ? '✅ Presente (oculta)' : '❌ NO DEFINIDA'}`);
  console.log(`   - Destinatario de prueba: ${toEmail || '❌ NO DEFINIDO'}`);

  if (!region || !fromEmail || !accessKeyId || !secretAccessKey || !toEmail) {
    console.error('\n❌ ERROR: Faltan variables obligatorias en el archivo backend/.env.');
    console.error('Asegúrate de configurar AWS_REGION, SES_FROM_EMAIL, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY.');
    process.exit(1);
  }

  const client = new SESv2Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    maxAttempts: 1,
  });

  console.log(`\n2. Intentando enviar correo de prueba desde "${fromName}" <${fromEmail}> hacia "${toEmail}"...`);

  try {
    const response = await client.send(
      new SendEmailCommand({
        FromEmailAddress: `"${fromName}" <${fromEmail}>`,
        Destination: { ToAddresses: [toEmail] },
        Content: {
          Simple: {
            Subject: { Data: 'Prueba de conexión exitosa - Arcoins Wallet SES', Charset: 'UTF-8' },
            Body: {
              Text: {
                Data: '¡Felicidades! Tu configuración de AWS SES con Arcoins Wallet está funcionando correctamente.',
                Charset: 'UTF-8',
              },
              Html: {
                Data: '<h3>¡Felicidades!</h3><p>Tu configuración de <strong>AWS SES</strong> con <strong>Arcoins Wallet</strong> está funcionando correctamente.</p>',
                Charset: 'UTF-8',
              },
            },
          },
        },
      })
    );

    console.log('\n✅ ¡ÉXITO TOTAL! El correo fue aceptado por AWS SES.');
    console.log(`   ID de Mensaje: ${response.MessageId}`);
    console.log('   Revisa la bandeja de entrada (y la carpeta de spam) de:', toEmail);
  } catch (error: any) {
    console.error('\n❌ FALLÓ EL ENVÍO. Diagnóstico del error:\n');
    console.error(`   Nombre del error: ${error.name}`);
    console.error(`   Mensaje: ${error.message}\n`);

    if (error.name === 'MessageRejected') {
      console.error('👉 CAUSA PROBABLE: MODO SANDBOX DE AWS SES O CORREO NO VERIFICADO.');
      console.error('   En cuentas nuevas de AWS SES:');
      console.error(`   1. El remitente (${fromEmail}) DEBE estar verificado en AWS SES.`);
      console.error(`   2. En modo Sandbox, el DESTINATARIO (${toEmail}) TAMBIÉN DEBE estar verificado en AWS SES.`);
      console.error('   SOLUCIÓN:');
      console.error('   - Ve a la consola de AWS SES -> Verified Identities -> Create Identity.');
      console.error('   - Selecciona "Email address", escribe el correo y haz clic en crear.');
      console.error('   - Revisa la bandeja del correo y haz clic en el enlace de confirmación de Amazon.');
    } else if (error.name === 'AccessDeniedException' || error.name === 'AccessDenied') {
      console.error('👉 CAUSA PROBABLE: PERMISOS INSUFICIENTES EN EL USUARIO IAM.');
      console.error('   El usuario IAM asociado a las credenciales no tiene permiso para enviar correos.');
      console.error('   SOLUCIÓN:');
      console.error('   - Ve a la consola de AWS IAM -> Users -> selecciona tu usuario.');
      console.error('   - En "Permissions", añade la política "AmazonSESFullAccess" (o crea una política con ses:SendEmail).');
    } else if (error.name === 'InvalidClientTokenId' || error.name === 'UnrecognizedClientException') {
      console.error('👉 CAUSA PROBABLE: AWS_ACCESS_KEY_ID INVÁLIDA.');
      console.error('   Verifica que la clave de acceso de IAM esté copiada sin espacios ni comillas.');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('👉 CAUSA PROBABLE: AWS_SECRET_ACCESS_KEY INVÁLIDA.');
      console.error('   Verifica que la clave secreta de IAM esté correctamente copiada sin espacios.');
    } else {
      console.error('👉 Revisa la configuración de red, región y credenciales.');
    }

    process.exit(1);
  }
}

void testSES();

