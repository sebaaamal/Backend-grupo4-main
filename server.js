const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MySQL
const db = mysql.createConnection({
  host: 'db-grupo4.cun84ce2inq2.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'admin2025',
  database: 'backend',
});

db.connect(err => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos');
  }
});

// Configuración de AWS SNS
AWS.config.update({
  accessKeyId: 'AKIAXQ5GQDI7Z2K7LIU5', 
  secretAccessKey: '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', 
  region: 'us-east-2' 
});

const sns = new AWS.SNS();
const topicArn = 'arn:aws:sns:us-east-2:517355870783:NotiCoc'; 

// Endpoint para guardar y notificar la consulta
app.post('/api/consultas', (req, res) => {
  const { nombres, apellidos, correo, telefono, mensaje } = req.body;

  const sql = 'INSERT INTO consultas (nombres, apellidos, correo, telefono, mensaje) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [nombres, apellidos, correo, telefono, mensaje], (err, result) => {
    if (err) {
      console.error('Error al insertar:', err);
      return res.status(500).json({ error: 'Error al insertar los datos' });
    }

    // Mensaje para enviar por correo
    const mensajeSNS = `
📬 Nueva consulta recibida:

👤 Nombre: ${nombres} ${apellidos}
📧 Correo: ${correo}
📞 Teléfono: ${telefono}

💬 Mensaje:
${mensaje}
    `;

    const params = {
      Message: mensajeSNS,
      Subject: 'Nueva consulta desde el formulario',
      TopicArn: topicArn
    };

    sns.publish(params, (snsErr, data) => {
      if (snsErr) {
        console.error('Error al enviar notificación SNS:', snsErr);
        return res.status(500).json({ error: 'Consulta registrada pero no se notificó' });
      }

      console.log('Notificación SNS enviada:', data.MessageId);
      res.status(200).json({ message: 'Consulta registrada y notificada correctamente' });
    });
  });
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
