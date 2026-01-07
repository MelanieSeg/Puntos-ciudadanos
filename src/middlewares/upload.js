import multer from 'multer';

// Configurar almacenamiento en memoria
// El archivo se guardará temporalmente en RAM antes de subirlo a Cloudinary
const storage = multer.memoryStorage();

// Filtro para validar que solo se suban imágenes
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, GIF, WebP)'), false);
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5MB
  },
  fileFilter: fileFilter,
});

export default upload;
